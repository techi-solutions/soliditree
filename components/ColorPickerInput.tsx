import { CreatePageFormData } from "@/app/new/[contractAddress]/container";
import { useState } from "react";
import { FieldErrors, UseFormRegister, UseFormSetValue } from "react-hook-form";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Button } from "./ui/button";
import { HexAlphaColorPicker } from "react-colorful";

export default function ColorPickerInput({
  name,
  label,
  register,
  colors,
  setColors,
  setValue,
  errors,
}: {
  name: keyof CreatePageFormData["colors"];
  label: string;
  register: UseFormRegister<CreatePageFormData>;
  colors: CreatePageFormData["colors"];
  setColors: (colors: CreatePageFormData["colors"]) => void;
  setValue: UseFormSetValue<CreatePageFormData>;
  errors: FieldErrors<CreatePageFormData>;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <div className="flex items-center space-x-2">
        <Input
          id={name}
          {...register(`colors.${name}`)}
          value={colors[name]}
          onChange={(e) => {
            const newColor = e.target.value;
            setColors({ ...colors, [name]: newColor });
            setValue(`colors.${name}`, newColor);
          }}
          className="text-input w-28"
        />
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-10 h-10 p-0"
              style={{ backgroundColor: colors[name] }}
            />
          </PopoverTrigger>
          <PopoverContent className="w-auto p-3">
            <HexAlphaColorPicker
              color={colors[name]}
              onChange={(newColor) => {
                setColors({ ...colors, [name]: newColor });
                setValue(`colors.${name}`, newColor);
              }}
            />
          </PopoverContent>
        </Popover>
      </div>
      {errors.colors?.[name] && (
        <p className="text-red-500">{errors.colors[name]?.message}</p>
      )}
    </div>
  );
}
