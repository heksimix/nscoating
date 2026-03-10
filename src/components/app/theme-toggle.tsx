
"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";

import { useTheme } from "@/hooks/use-theme";
import { SidebarMenuButton } from "@/components/ui/sidebar";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const toggle = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  }

  return (
    <SidebarMenuButton 
      onClick={toggle} 
      tooltip={theme === 'dark' ? 'Светла тема' : 'Тъмна тема'}
      className="justify-center"
    >
      <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Превключване на темата</span>
    </SidebarMenuButton>
  );
}
