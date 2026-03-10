'use client';

import * as React from "react";
import { Sidebar, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarFooter, useSidebar } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { ClipboardList, FileText, Download, Upload, Users, Settings, LogOut, ChevronsLeftRight, Wallet, User as UserIcon, BarChartHorizontal, ChevronLeft, ChevronRight } from "lucide-react";
import { CompanySettingsForm } from "./company-settings-form";
import { useToast } from "@/hooks/use-toast";
import { useAppData } from "@/hooks/use-app-data";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { exportToExcel } from "@/lib/excel-export";
import { exportExpensesToExcel } from "@/lib/excel-export-expenses";
import NextLink from "next/link";
import { useCompanyData } from "@/hooks/use-company-data";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ThemeToggle } from "./theme-toggle";
import { useUser } from "@/firebase/auth/use-user";
import { useAuth } from "@/firebase";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { format, addMonths, subMonths } from "date-fns";
import { bg } from "date-fns/locale";


export function AppSidebar({ pathname }: { pathname: string }) {
  const { state: sidebarState, toggleSidebar } = useSidebar();
  const { companyData } = useCompanyData();
  const router = useRouter();
  const { orders, fixedExpenses, monthlyExpenses, variableExpenses, monthlyIncomes } = useAppData();
  const { toast } = useToast();
  const auth = useAuth();
  const { user } = useUser();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const [isSettingsSheetOpen, setSettingsSheetOpen] = React.useState(false);
  const [isExportDialogOpen, setIsExportDialogOpen] = React.useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = React.useState(false);
  const [importType, setImportType] = React.useState<'orders' | 'expenses' | null>(null);
  const [exportMonth, setExportMonth] = React.useState(new Date());
  
  const handleOrdersExport = () => {
    if (orders.length > 0) {
      exportToExcel(orders);
      toast({
        title: "Експортът е успешен",
        description: "Данните за поръчките са експортирани в Excel файл.",
      });
    } else {
      toast({
          title: "Няма данни за експорт",
          description: "Няма запазени поръчки, които да бъдат експортирани.",
          variant: "destructive"
      })
    }
    setIsExportDialogOpen(false);
  };

  const handleExpensesExport = () => {
    const appData = { fixedExpenses, monthlyExpenses, variableExpenses, monthlyIncomes };
    exportExpensesToExcel(appData, exportMonth);
    toast({
        title: "Експортът е успешен",
        description: `Данните за приходи/разходи за ${format(exportMonth, 'LLLL yyyy', { locale: bg })} са експортирани.`,
    });
    setIsExportDialogOpen(false);
  }

  const handleImportClick = (type: 'orders' | 'expenses') => {
    setImportType(type);
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && importType) {
      const importChannel = new BroadcastChannel('import_data');
      importChannel.postMessage({ file, type: importType });
      importChannel.close();
      // Reset file input
      event.target.value = '';
      setIsImportDialogOpen(false);
      setImportType(null);
    }
  };


  const handleLogout = async () => {
    if (auth) {
      await auth.signOut();
      router.push('/login');
    }
  };

  return (
    <>
       <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            onChange={handleFileChange}
            accept=".xlsx, .xls"
        />
      <Sidebar collapsible="icon">
        <SidebarHeader>
            {/* User block removed from here */}
        </SidebarHeader>
        <SidebarContent className="p-2">
            <SidebarMenu>
                <SidebarMenuItem>
                    <SidebarMenuButton onClick={toggleSidebar} tooltip={sidebarState === 'expanded' ? "Свий панела" : "Разшири панела"} className="justify-center">
                        <ChevronsLeftRight className="h-5 w-5" />
                    </SidebarMenuButton>
                </SidebarMenuItem>
            </SidebarMenu>

          <SidebarMenu>
             <SidebarMenuItem>
                <NextLink href="/" passHref>
                    <SidebarMenuButton isActive={pathname === '/'} tooltip="Поръчки">
                        <ClipboardList />
                        <span>Поръчки</span>
                    </SidebarMenuButton>
                </NextLink>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <NextLink href="/clients" passHref>
                <SidebarMenuButton isActive={pathname === '/clients'} tooltip="Клиенти">
                  <Users />
                  <span>Клиенти</span>
                </SidebarMenuButton>
              </NextLink>
            </SidebarMenuItem>
             <SidebarMenuItem>
                 <NextLink href="/reports" passHref>
                    <SidebarMenuButton isActive={pathname === '/reports'} tooltip="Справка обороти">
                        <FileText />
                        <span>Справка обороти</span>
                    </SidebarMenuButton>
                </NextLink>
            </SidebarMenuItem>
            <SidebarMenuItem>
                 <NextLink href="/analytics" passHref>
                    <SidebarMenuButton isActive={pathname === '/analytics'} tooltip="Анализи">
                        <BarChartHorizontal />
                        <span>Анализи</span>
                    </SidebarMenuButton>
                </NextLink>
            </SidebarMenuItem>
            <SidebarMenuItem>
                 <NextLink href="/expenses" passHref>
                    <SidebarMenuButton isActive={pathname === '/expenses'} tooltip="Приходи, Разходи">
                        <Wallet />
                        <span>Приходи, Разходи</span>
                    </SidebarMenuButton>
                </NextLink>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter className="p-2">
          <SidebarMenu>
            <SidebarMenuItem>
              <ThemeToggle />
            </SidebarMenuItem>
             <SidebarMenuItem>
                <SidebarMenuButton onClick={() => setIsImportDialogOpen(true)} tooltip="Импорт (Excel)">
                    <Upload />
                    <span>Импорт (Excel)</span>
                </SidebarMenuButton>
            </SidebarMenuItem>
             <SidebarMenuItem>
                <SidebarMenuButton onClick={() => setIsExportDialogOpen(true)} tooltip="Експорт (Excel)">
                    <Download />
                    <span>Експорт (Excel)</span>
                </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={() => setSettingsSheetOpen(true)} tooltip="Настройки">
                <Settings />
                <span>Настройки</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
            
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="flex items-center gap-2 p-2 mt-auto rounded-md cursor-pointer hover:bg-sidebar-accent transition-colors group/user group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0">
                    <Avatar className="h-8 w-8">
                        <AvatarImage src={user.photoURL || ''} />
                        <AvatarFallback>{user.displayName?.charAt(0) || user.email?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col overflow-hidden group-data-[collapsible=icon]:hidden">
                        <span className="text-sm font-semibold truncate text-sidebar-foreground">
                            {user.displayName || 'Потребител'}
                        </span>
                        <span className="text-xs truncate text-sidebar-foreground/70">
                            {user.email}
                        </span>
                    </div>
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" align="start" className="w-56 ml-2 mb-1">
                 <DropdownMenuItem onSelect={() => router.push('/profile')}>
                    <UserIcon className="mr-2 h-4 w-4" />
                    <span>Профил</span>
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Изход</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </SidebarFooter>
      </Sidebar>

      <Dialog open={isSettingsSheetOpen} onOpenChange={setSettingsSheetOpen}>
        <DialogContent className="sm:max-w-2xl w-[90vw]">
          <DialogHeader>
            <DialogTitle>Настройки на фирмата</DialogTitle>
            <DialogDescription>Въведете данните на вашата фирма тук. Те ще се използват в приемо-предавателните протоколи.</DialogDescription>
          </DialogHeader>
          <CompanySettingsForm onClose={() => setSettingsSheetOpen(false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Избор на експорт</DialogTitle>
            <DialogDescription>
              Изберете какъв тип данни желаете да експортирате.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 pt-4">
            <div className="flex flex-col items-center gap-2 rounded-lg border p-4">
              <h3 className="font-semibold">Експорт на поръчки</h3>
              <p className="text-sm text-center text-muted-foreground">
                Експортира всички поръчки в детайлен Excel файл.
              </p>
              <Button onClick={handleOrdersExport} className="mt-2 w-full">
                <Download className="mr-2 h-4 w-4" />
                Експорт на поръчки
              </Button>
            </div>
            <div className="flex flex-col items-center gap-2 rounded-lg border p-4">
              <h3 className="font-semibold">Приходи и разходи</h3>
              <p className="text-sm text-center text-muted-foreground">
                Експортира обобщена справка за приходи и разходи за избран месец.
              </p>
              <div className="flex items-center gap-2 text-md font-semibold capitalize my-3">
                <Button variant="outline" size="icon" onClick={() => setExportMonth(subMonths(exportMonth, 1))}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span>{format(exportMonth, "LLLL yyyy", { locale: bg })}</span>
                <Button variant="outline" size="icon" onClick={() => setExportMonth(addMonths(exportMonth, 1))}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <Button onClick={handleExpensesExport} className="w-full">
                 <Download className="mr-2 h-4 w-4" />
                Експорт на приходи/разходи
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Избор на импорт</DialogTitle>
            <DialogDescription>
              Изберете какъв тип данни желаете да импортирате от Excel файл.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <Button onClick={() => handleImportClick('orders')} className="w-full">
              <Upload className="mr-2 h-4 w-4" />
              Импорт на поръчки
            </Button>
            <Button onClick={() => handleImportClick('expenses')} className="w-full">
              <Upload className="mr-2 h-4 w-4" />
              Импорт на приходи/разходи
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
