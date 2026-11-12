// "use client"

// import * as React from "react"
// import { Moon, Sun } from "lucide-react"
// import { useTheme } from "next-themes"

// import { Button } from "@/components/ui/button"
// import {
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuItem,
//   DropdownMenuTrigger,
// } from "@/components/ui/dropdown-menu"

// export function ModeToggle() {
//   const { setTheme } = useTheme()

//   return (
//     <DropdownMenu>
//       <DropdownMenuTrigger render={<Button className="relative bg-transparent border-0" variant="outline" size="icon" />}>
//         <Sun className="h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
//         <Moon className="absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
//         <span className="sr-only">Toggle theme</span>
//       </DropdownMenuTrigger>
//       <DropdownMenuContent align="end">
//         <DropdownMenuItem onClick={() => setTheme("light")}>
//           Light
//         </DropdownMenuItem>
//         <DropdownMenuItem onClick={() => setTheme("dark")}>
//           Dark
//         </DropdownMenuItem>
//         <DropdownMenuItem onClick={() => setTheme("system")}>
//           System
//         </DropdownMenuItem>
//       </DropdownMenuContent>
//     </DropdownMenu>
//   )
// }

"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function ModeToggle() {
  const { setTheme, resolvedTheme } = useTheme();
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  const isDark = isMounted && resolvedTheme === "dark";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            className="relative border-0 bg-transparent hover:!bg-muted hover:!text-foreground dark:hover:!bg-muted/50"
            variant="outline"
            size="icon"
          />
        }
      >
        <Sun
          className={`h-[1.2rem] w-[1.2rem] transition-all duration-300 ${
            isDark
              ? "-rotate-90 scale-0 opacity-0"
              : "rotate-0 scale-100 opacity-100"
          }`}
        />

        <Moon
          className={`absolute h-[1.2rem] w-[1.2rem] transition-all duration-300 ${
            isDark
              ? "rotate-0 scale-100 opacity-100"
              : "rotate-90 scale-0 opacity-0"
          }`}
        />

        <span className="sr-only">Toggle theme</span>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-32 min-w-32 !rounded-md !border !border-zinc-200 !bg-white p-1 !shadow-md dark:!border-zinc-700 dark:!bg-zinc-900"
      >
        <DropdownMenuItem
          className="h-8 px-2 text-sm text-black data-highlighted:!bg-zinc-100 dark:text-white dark:data-highlighted:!bg-zinc-800"
          onClick={() => setTheme("light")}
        >
          Light
        </DropdownMenuItem>

        <DropdownMenuItem
          className="h-8 px-2 text-sm text-black data-highlighted:!bg-zinc-100 dark:text-white dark:data-highlighted:!bg-zinc-800"
          onClick={() => setTheme("dark")}
        >
          Dark
        </DropdownMenuItem>

        <DropdownMenuItem
          className="h-8 px-2 text-sm text-black data-highlighted:!bg-zinc-100 dark:text-white dark:data-highlighted:!bg-zinc-800"
          onClick={() => setTheme("system")}
        >
          System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}