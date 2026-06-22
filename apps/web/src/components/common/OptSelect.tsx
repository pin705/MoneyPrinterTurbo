import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface SelectOption {
  value: string;
  label: string;
}

interface OptSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  options: SelectOption[];
  id?: string;
  placeholder?: string;
  className?: string;
}

export function OptSelect({
  value,
  onValueChange,
  options,
  id,
  placeholder,
  className,
}: OptSelectProps) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger id={id} className={"bg-zinc-800/50 border-zinc-700/50 text-zinc-100 focus:border-emerald-500/50 focus:ring-emerald-500/20 " + (className ?? "")}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className="bg-zinc-800 border-zinc-700">
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value} className="text-zinc-300 focus:bg-emerald-500/10 focus:text-emerald-400">
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
