"use client";

import { useState, useRef, useCallback } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";
import { ContractPage, ContractPageColors } from "@/services/contractPages";
import { Progress } from "@/components/ui/progress";
import { Loader2, ImageIcon } from "lucide-react";
import Image from "next/image";
import ColorPickerInput from "@/components/ColorPickerInput";
import { ExtendedAbi } from "@/services/scan";
import { ContractPagesUpdatePageContentHash } from "@/services/contractPages/client";

const formSchema = z.object({
  title: z.string().min(1, "Your page needs a title"),
  description: z.string().min(1, "Provide a short description of your page"),
  icon: z.instanceof(File).optional(),
  website: z.union([z.string().url(), z.string().length(0)]).optional(),
  backgroundImage: z.instanceof(File).optional(),
  colors: z.object({
    background: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid hex color"),
    card: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid hex color"),
    cardText: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid hex color"),
    button: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid hex color"),
    buttonText: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid hex color"),
  }),
});

type EditPageFormData = z.infer<typeof formSchema>;

export default function Container({
  pageId,
  resolvedPageId,
  contractPage,
  editPage,
  unpinOldContent,
}: {
  pageId: string;
  resolvedPageId: string;
  contractPage: ContractPage;
  editPage: (
    formData: FormData,
    functions: ExtendedAbi,
    colors: ContractPageColors
  ) => Promise<{ newHash: string; uploadData: ContractPage; oldHash: string }>;
  unpinOldContent: (
    oldHash: string,
    oldPage: ContractPage,
    newPage: ContractPage
  ) => Promise<void>;
}) {
  const router = useRouter();
  const [colors, setColors] = useState<ContractPageColors>(
    contractPage.colors || {
      background: "#10b77f",
      card: "#10b77f",
      cardText: "#FFFFFF",
      button: "#489587",
      buttonText: "#FFFFFF",
    }
  );
  const [iconObjectUrl, setIconObjectUrl] = useState<string | null>(
    contractPage.icon || null
  );
  const [backgroundObjectUrl, setBackgroundObjectUrl] = useState<string | null>(
    contractPage.backgroundImage || null
  );
  const [editStatus, setEditStatus] = useState<
    | "idle"
    | "uploading"
    | "approval"
    | "updating"
    | "unpinning"
    | "success"
    | "error"
  >("idle");

  console.log(iconObjectUrl);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const backgroundImageRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<EditPageFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: contractPage.title,
      description: contractPage.description,
      website: contractPage.website,
      colors: colors,
    },
  });

  const handleEditPage = useCallback(
    async (
      formData: FormData,
      functions: ExtendedAbi,
      colors: ContractPageColors
    ) => {
      return editPage(formData, functions, colors);
    },
    [editPage]
  );

  const handleUnpinOldContent = useCallback(
    async (oldHash: string, oldPage: ContractPage, newPage: ContractPage) => {
      return unpinOldContent(oldHash, oldPage, newPage);
    },
    [unpinOldContent]
  );

  const onSubmit = async (data: EditPageFormData) => {
    setEditStatus("uploading");
    try {
      const formData = new FormData();

      // Append form fields to FormData
      Object.entries(data).forEach(([key, value]) => {
        if (key !== "colors") {
          formData.append(key, value as string);
        }
      });

      // Append the icon file if it exists
      if (fileInputRef.current?.files?.[0]) {
        formData.append("icon", fileInputRef.current.files[0]);
      }

      // Append the background image file if it exists
      if (backgroundImageRef.current?.files?.[0]) {
        formData.append("backgroundImage", backgroundImageRef.current.files[0]);
      }

      // Use the existing functions from the contractPage
      const functions = contractPage.functions;

      const { newHash, uploadData, oldHash } = await handleEditPage(
        formData,
        functions,
        colors
      );
      console.log("New IPFS hash:", newHash);

      // Update the page content hash in the smart contract
      setEditStatus("approval");
      await ContractPagesUpdatePageContentHash(
        resolvedPageId,
        `ipfs://${newHash}`,
        () => setEditStatus("updating")
      );

      setEditStatus("unpinning");
      // Unpin old content after successful update
      await handleUnpinOldContent(oldHash, contractPage, uploadData);

      console.log("pageId", pageId);

      setEditStatus("success");
      router.push(`/${pageId}`);
    } catch (error) {
      console.error("Error updating page:", error);
      setEditStatus("error");
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === "image/svg+xml") {
      setIconObjectUrl(URL.createObjectURL(file));
      event.target.setAttribute("data-file-name", file.name);
    } else {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
        fileInputRef.current.removeAttribute("data-file-name");
      }
      setIconObjectUrl(null);
    }
  };

  const handleBackgroundImageChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      setBackgroundObjectUrl(URL.createObjectURL(file));
      event.target.setAttribute("data-file-name", file.name);
    } else {
      if (backgroundImageRef.current) {
        backgroundImageRef.current.value = "";
        backgroundImageRef.current.removeAttribute("data-file-name");
      }
      setBackgroundObjectUrl(null);
    }
  };

  return (
    <div className="container mx-auto p-4 space-y-6 text-black max-w-3xl relative pb-20 bg-white rounded-xl">
      <h1 className="text-2xl font-bold mb-4">Edit Contract Page</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Label htmlFor="title">Title</Label>
          <Input id="title" {...register("title")} className="text-input" />
          {errors.title && (
            <p className="text-red-500">{errors.title.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" {...register("description")} />
          {errors.description && (
            <p className="text-red-500">{errors.description.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="icon">Icon (SVG only) (optional)</Label>
          <div className="relative">
            <Input
              id="icon"
              type="file"
              accept=".svg"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="pl-8 text-input file:mr-4 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100 file:cursor-pointer"
              style={{ paddingTop: 5 }}
            />
            <div className="absolute" style={{ top: 2, left: 2 }}>
              {iconObjectUrl ? (
                <Image
                  src={iconObjectUrl}
                  alt="Icon"
                  width={24}
                  height={24}
                  className="ml-1"
                />
              ) : (
                <ImageIcon className="h-8 w-8 text-muted-foreground" />
              )}
            </div>
          </div>
          {errors.icon && <p className="text-red-500">{errors.icon.message}</p>}
        </div>

        <div>
          <Label htmlFor="website">Website Link (optional)</Label>
          <Input id="website" {...register("website")} className="text-input" />
          {errors.website && (
            <p className="text-red-500">{errors.website.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="backgroundImage">Background Image (optional)</Label>
          <div className="relative">
            <Input
              id="backgroundImage"
              type="file"
              accept=".png,.jpg,.jpeg"
              ref={backgroundImageRef}
              onChange={handleBackgroundImageChange}
              className="pl-8 text-input file:mr-4 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100 file:cursor-pointer"
              style={{ paddingTop: 5 }}
            />
            <div
              className="absolute flex items-center justify-center overflow-hidden rounded-sm"
              style={{
                top: 4,
                left: 4,
                width: 28,
                height: 28,
              }}
            >
              {backgroundObjectUrl ? (
                <Image
                  src={backgroundObjectUrl}
                  alt="Background image"
                  width={28}
                  height={28}
                  objectFit="cover"
                  objectPosition="center"
                  className="h-full w-full overflow-hidden object-cover object-center"
                />
              ) : (
                <ImageIcon className="h-8 w-8 text-muted-foreground" />
              )}
            </div>
          </div>
          {errors.backgroundImage && (
            <p className="text-red-500">{errors.backgroundImage.message}</p>
          )}
        </div>

        <div className="w-full space-y-4 flex flex-col">
          <h3 className="text-lg font-semibold">Color Settings</h3>
          <div className="flex space-x-4">
            <div className="flex flex-col space-y-2">
              {Object.keys(colors).map((colorKey) => (
                <ColorPickerInput
                  key={colorKey}
                  name={colorKey as keyof ContractPageColors}
                  label={`${
                    colorKey.charAt(0).toUpperCase() + colorKey.slice(1)
                  } Color`}
                  register={register}
                  colors={colors}
                  setColors={setColors}
                  setValue={setValue}
                  errors={errors}
                />
              ))}
            </div>
            <div
              className="flex flex-1 rounded-sm"
              style={{
                backgroundColor: colors.background,
                backgroundImage: backgroundObjectUrl
                  ? `url(${backgroundObjectUrl})`
                  : undefined,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            >
              <div className="flex flex-1 flex-col justify-center items-center">
                <div
                  className="flex flex-col justify-start items-center rounded-xl h-60 w-40 p-4"
                  style={{ backgroundColor: colors.card }}
                >
                  <p style={{ color: colors.cardText }}>Title</p>
                  <p style={{ color: colors.cardText }}>Description</p>
                  <div className="flex flex-1 w-full flex-col mt-4 space-y-2">
                    <Button
                      className="w-full"
                      style={{
                        backgroundColor: colors.button,
                        color: colors.buttonText,
                      }}
                    >
                      Button
                    </Button>
                    <Button
                      className="w-full"
                      style={{
                        backgroundColor: colors.button,
                        color: colors.buttonText,
                      }}
                    >
                      Button
                    </Button>
                    <Button
                      className="w-full"
                      style={{
                        backgroundColor: colors.button,
                        color: colors.buttonText,
                      }}
                    >
                      Button
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="fixed bottom-0 left-0 right-0 bg-white p-4 shadow-md">
          <div className="flex items-center justify-between container mx-auto max-w-2xl">
            {editStatus === "idle" || editStatus === "error" ? (
              <Button type="submit" className="w-full">
                Update Page
              </Button>
            ) : (
              <div className="w-full flex flex-col items-center justify-center">
                <p className="text-sm text-muted-foreground">
                  {editStatus === "uploading"
                    ? "Uploading page content ⏳"
                    : editStatus === "approval"
                    ? "Approve transaction in your wallet"
                    : editStatus === "updating"
                    ? "Updating page content 🌐"
                    : editStatus === "unpinning"
                    ? "Cleaning up old content 🧹"
                    : editStatus === "success"
                    ? "Page updated 🎉"
                    : ""}
                </p>
                <div className="w-full flex items-center justify-center">
                  <Progress
                    value={
                      editStatus === "uploading"
                        ? 10
                        : editStatus === "approval"
                        ? 30
                        : editStatus === "updating"
                        ? 50
                        : editStatus === "unpinning"
                        ? 70
                        : editStatus === "success"
                        ? 100
                        : 0
                    }
                  />
                  <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                </div>
              </div>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
