package expo.modules.usbprinter

import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.hardware.usb.UsbConstants
import android.hardware.usb.UsbDeviceConnection
import android.hardware.usb.UsbEndpoint
import android.hardware.usb.UsbInterface
import android.hardware.usb.UsbManager
import android.os.Build
import android.util.Base64
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.util.concurrent.CountDownLatch
import java.util.concurrent.TimeUnit

private const val ACTION_USB_PERMISSION = "net.decatron.optimapos.USB_PERMISSION"
private const val TRANSFER_TIMEOUT_MS = 10_000
private const val PERMISSION_TIMEOUT_SEC = 60L

class UsbPrinterModule : Module() {

  private var activeConnection: UsbDeviceConnection? = null
  private var activeEndpoint: UsbEndpoint? = null
  private var activeInterface: UsbInterface? = null

  private val usbManager: UsbManager?
    get() = appContext.reactContext?.getSystemService(Context.USB_SERVICE) as? UsbManager

  override fun definition() = ModuleDefinition {
    Name("UsbPrinter")

    // ─── listDevices ───────────────────────────────────────────────────────────
    AsyncFunction("listDevices") {
      val mgr = usbManager ?: return@AsyncFunction emptyList<Map<String, Any>>()
      mgr.deviceList.values.map { dev ->
        mapOf(
          "vendorId"    to dev.vendorId,
          "productId"   to dev.productId,
          "deviceName"  to (dev.deviceName ?: ""),
          "productName" to (dev.productName ?: "Impresora USB")
        )
      }
    }

    // ─── connect ───────────────────────────────────────────────────────────────
    // Corre en background thread — puede bloquear esperando el permiso del usuario.
    AsyncFunction("connect") { vendorId: Int, productId: Int ->
      val mgr = usbManager
        ?: return@AsyncFunction mapOf("success" to false, "error" to "USB Manager no disponible")
      val ctx = appContext.reactContext
        ?: return@AsyncFunction mapOf("success" to false, "error" to "Sin contexto Android")

      val device = mgr.deviceList.values.find {
        it.vendorId == vendorId && it.productId == productId
      } ?: return@AsyncFunction mapOf(
        "success" to false,
        "error"   to "Dispositivo no encontrado. Verifica que el cable esté conectado."
      )

      // Si ya tiene permiso, conectar directo
      if (!mgr.hasPermission(device)) {
        val latch = CountDownLatch(1)
        var granted = false

        val receiver = object : BroadcastReceiver() {
          override fun onReceive(context: Context, intent: Intent) {
            context.unregisterReceiver(this)
            granted = intent.getBooleanExtra(UsbManager.EXTRA_PERMISSION_GRANTED, false)
            latch.countDown()
          }
        }

        val flags = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S)
          PendingIntent.FLAG_MUTABLE else 0
        val pi = PendingIntent.getBroadcast(ctx, 0, Intent(ACTION_USB_PERMISSION), flags)

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
          ctx.registerReceiver(receiver, IntentFilter(ACTION_USB_PERMISSION), Context.RECEIVER_NOT_EXPORTED)
        } else {
          @Suppress("UnspecifiedRegisterReceiverFlag")
          ctx.registerReceiver(receiver, IntentFilter(ACTION_USB_PERMISSION))
        }

        mgr.requestPermission(device, pi)

        // Esperar respuesta del usuario (máx 60 segundos)
        if (!latch.await(PERMISSION_TIMEOUT_SEC, TimeUnit.SECONDS)) {
          runCatching { ctx.unregisterReceiver(receiver) }
          return@AsyncFunction mapOf("success" to false, "error" to "Timeout: el usuario no respondió el permiso USB")
        }

        if (!granted) {
          return@AsyncFunction mapOf("success" to false, "error" to "Permiso USB denegado por el usuario")
        }
      }

      openDevice(mgr, device)
    }

    // ─── sendBytes ─────────────────────────────────────────────────────────────
    AsyncFunction("sendBytes") { base64Data: String ->
      val conn = activeConnection
      val ep   = activeEndpoint
      if (conn == null || ep == null) {
        return@AsyncFunction mapOf("success" to false, "error" to "No hay impresora USB conectada")
      }
      try {
        val bytes   = Base64.decode(base64Data, Base64.DEFAULT)
        val written = conn.bulkTransfer(ep, bytes, bytes.size, TRANSFER_TIMEOUT_MS)
        if (written >= 0) {
          mapOf("success" to true, "bytesWritten" to written)
        } else {
          mapOf("success" to false, "error" to "Transferencia fallida (código USB: $written)")
        }
      } catch (e: Exception) {
        mapOf("success" to false, "error" to (e.message ?: "Error de transferencia USB"))
      }
    }

    // ─── disconnect ────────────────────────────────────────────────────────────
    AsyncFunction("disconnect") {
      doDisconnect()
    }

    // ─── isConnected ───────────────────────────────────────────────────────────
    AsyncFunction("isConnected") {
      activeConnection != null && activeEndpoint != null
    }
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  private fun openDevice(mgr: UsbManager, device: android.hardware.usb.UsbDevice): Map<String, Any> {
    doDisconnect()

    val conn = mgr.openDevice(device)
      ?: return mapOf("success" to false, "error" to "No se pudo abrir el dispositivo USB")

    for (i in 0 until device.interfaceCount) {
      val intf = device.getInterface(i)
      for (j in 0 until intf.endpointCount) {
        val ep = intf.getEndpoint(j)
        if (ep.type == UsbConstants.USB_ENDPOINT_XFER_BULK && ep.direction == UsbConstants.USB_DIR_OUT) {
          if (conn.claimInterface(intf, true)) {
            activeConnection = conn
            activeInterface  = intf
            activeEndpoint   = ep
            return mapOf("success" to true)
          }
        }
      }
    }

    conn.close()
    return mapOf("success" to false, "error" to "No se encontró endpoint de impresión. ¿Es una impresora ESC/POS compatible?")
  }

  private fun doDisconnect() {
    runCatching {
      activeInterface?.let { activeConnection?.releaseInterface(it) }
      activeConnection?.close()
    }
    activeConnection = null
    activeInterface  = null
    activeEndpoint   = null
  }
}
