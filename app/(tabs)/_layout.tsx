import { Tabs } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { TAB_CONFIG, ALL_TAB_NAMES } from '@/utils/roles';
import { Colors } from '@/constants/theme';
import type { Role } from '@/types';

export default function TabLayout() {
  const { user } = useAuth();
  const role: Role = (user?.role as Role) || 'CLIENT';
  const visibleTabs = TAB_CONFIG[role] || TAB_CONFIG.CLIENT;
  const visibleNames = new Set(visibleTabs.map(t => t.name));

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.tabActive,
        tabBarInactiveTintColor: Colors.tabInactive,
        tabBarStyle: {
          backgroundColor: Colors.card,
          borderTopColor: Colors.border,
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
          paddingTop: 4,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
        headerStyle: {
          backgroundColor: Colors.card,
        },
        headerTitleStyle: {
          fontWeight: '700',
          color: Colors.text,
          fontSize: 18,
        },
        headerShadowVisible: false,
      }}
    >
      {ALL_TAB_NAMES.map(tabName => {
        const config = visibleTabs.find(t => t.name === tabName);
        const Icon = config?.icon;

        return (
          <Tabs.Screen
            key={tabName}
            name={tabName}
            options={{
              href: visibleNames.has(tabName) ? undefined : null,
              title: config?.title ?? tabName,
              tabBarIcon: Icon
                ? ({ color, size }) => <Icon size={size || 24} color={color} />
                : undefined,
            }}
          />
        );
      })}
    </Tabs>
  );
}
