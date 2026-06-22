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
      <SelectTrigger id={id} className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
