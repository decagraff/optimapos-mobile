package expo.modules.usbprinter

import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.hardware.usb.UsbConstants
import android.hardware.usb.UsbDevice
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

private const val ACTION_USB_PERMISSION  = "net.decatron.optimapos.USB_PERMISSION"
private const val TRANSFER_TIMEOUT_MS    = 5_000
private const val PERMISSION_TIMEOUT_SEC = 60L
private const val CHUNK_SIZE             = 16_384 // 16 KB por transferencia

class UsbPrinterModule : Module() {

  private var activeConnection: UsbDeviceConnection? = null
  private var activeEndpoint:   UsbEndpoint?         = null
  private var activeInterface:  UsbInterface?         = null
  private var connectDebugInfo: String                = ""

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
          "deviceName"  to (dev.deviceName  ?: ""),
          "productName" to (dev.productName ?: "Impresora USB")
        )
      }
    }

    // ─── connect ───────────────────────────────────────────────────────────────
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

      if (!mgr.hasPermission(device)) {
        val latch   = CountDownLatch(1)
        var granted = false

        val receiver = object : BroadcastReceiver() {
          override fun onReceive(context: Context, intent: Intent) {
            context.unregisterReceiver(this)
            granted = intent.getBooleanExtra(UsbManager.EXTRA_PERMISSION_GRANTED, false)
            latch.countDown()
          }
        }

        // FLAG_IMMUTABLE requerido en Android 14+ (API 34) para intents implícitos
        val pi = PendingIntent.getBroadcast(ctx, 0, Intent(ACTION_USB_PERMISSION), PendingIntent.FLAG_IMMUTABLE)

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
          ctx.registerReceiver(receiver, IntentFilter(ACTION_USB_PERMISSION), Context.RECEIVER_NOT_EXPORTED)
        } else {
          @Suppress("UnspecifiedRegisterReceiverFlag")
          ctx.registerReceiver(receiver, IntentFilter(ACTION_USB_PERMISSION))
        }

        mgr.requestPermission(device, pi)

        if (!latch.await(PERMISSION_TIMEOUT_SEC, TimeUnit.SECONDS)) {
          runCatching { ctx.unregisterReceiver(receiver) }
          return@AsyncFunction mapOf("success" to false, "error" to "Timeout: usuario no respondió el permiso USB")
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
        return@AsyncFunction mapOf(
          "success" to false,
          "error"   to "No hay impresora USB conectada. Llama a connect() primero.",
          "debug"   to connectDebugInfo
        )
      }

      try {
        val bytes      = Base64.decode(base64Data, Base64.DEFAULT)
        val totalBytes = bytes.size
        var offset     = 0
        var chunks     = 0

        while (offset < totalBytes) {
          val end     = minOf(offset + CHUNK_SIZE, totalBytes)
          val chunk   = bytes.copyOfRange(offset, end)
          val written = conn.bulkTransfer(ep, chunk, chunk.size, TRANSFER_TIMEOUT_MS)

          if (written < 0) {
            return@AsyncFunction mapOf(
              "success" to false,
              "error"   to "bulkTransfer falló en chunk $chunks (offset $offset). Código: $written",
              "debug"   to "totalBytes=$totalBytes sent=$offset chunks=$chunks | $connectDebugInfo"
            )
          }
          offset += written
          chunks++
        }

        mapOf(
          "success"     to true,
          "bytesWritten" to offset,
          "chunks"      to chunks,
          "debug"       to connectDebugInfo
        )
      } catch (e: Exception) {
        mapOf(
          "success" to false,
          "error"   to (e.message ?: "Error de transferencia USB"),
          "debug"   to connectDebugInfo
        )
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

  // ─── openDevice ──────────────────────────────────────────────────────────────
  private fun openDevice(mgr: UsbManager, device: UsbDevice): Map<String, Any> {
    doDisconnect()

    val conn = mgr.openDevice(device)
      ?: return mapOf("success" to false, "error" to "No se pudo abrir el dispositivo USB")

    // Construir resumen de todas las interfaces para debug
    val ifacesSummary = buildString {
      for (i in 0 until device.interfaceCount) {
        val intf = device.getInterface(i)
        append("IF[$i] class=${intf.interfaceClass} ep=${intf.endpointCount}; ")
      }
    }

    // 1ª pasada: buscar interfaz USB Printer Class (7)
    val result = tryClaimBulkOut(conn, device, filterClass = 7)
      ?: tryClaimBulkOut(conn, device, filterClass = null) // fallback: cualquier clase

    if (result == null) {
      conn.close()
      return mapOf(
        "success" to false,
        "error"   to "No se encontró endpoint bulk-out compatible",
        "debug"   to ifacesSummary
      )
    }

    val (intf, ep) = result
    activeConnection = conn
    activeInterface  = intf
    activeEndpoint   = ep
    connectDebugInfo = "IF[${intf.id}] class=${intf.interfaceClass} ep#${ep.endpointNumber} addr=0x${ep.address.toString(16)} | $ifacesSummary"

    return mapOf(
      "success"        to true,
      "interfaceClass" to intf.interfaceClass,
      "interfaceId"    to intf.id,
      "endpointAddr"   to ep.address,
      "debug"          to connectDebugInfo
    )
  }

  /** Busca en las interfaces del dispositivo un endpoint bulk-out, opcionalmente filtrado por clase. */
  private fun tryClaimBulkOut(
    conn: UsbDeviceConnection,
    device: UsbDevice,
    filterClass: Int?
  ): Pair<UsbInterface, UsbEndpoint>? {
    for (i in 0 until device.interfaceCount) {
      val intf = device.getInterface(i)
      if (filterClass != null && intf.interfaceClass != filterClass) continue
      for (j in 0 until intf.endpointCount) {
        val ep = intf.getEndpoint(j)
        if (ep.type == UsbConstants.USB_ENDPOINT_XFER_BULK && ep.direction == UsbConstants.USB_DIR_OUT) {
          if (conn.claimInterface(intf, true)) return Pair(intf, ep)
        }
      }
    }
    return null
  }

  private fun doDisconnect() {
    runCatching {
      activeInterface?.let { activeConnection?.releaseInterface(it) }
      activeConnection?.close()
    }
    activeConnection = null
    activeInterface  = null
    activeEndpoint   = null
    connectDebugInfo = ""
  }
}
