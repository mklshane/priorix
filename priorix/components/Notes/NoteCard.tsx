"use client";

import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Pencil, Trash2, FolderInput, Clock, Folder } from "lucide-react";
import { Note, NoteFolder } from "@/types/note";
import { cn } from "@/lib/utils";

interface NoteCardProps {
	note: Note;
	folders: NoteFolder[];
	colorClass: string;
	onOpen: (noteId: string) => void;
	onRename: (note: Note) => void;
	onDelete: (noteId: string) => void;
	onMove: (noteId: string, folderId: string | null) => void;
}

const formatDate = (date: string) => {
	try {
		const d = new Date(date);
		const now = new Date();
		const diff = now.getTime() - d.getTime();
		const mins = Math.floor(diff / 60000);
		if (mins < 1) return "Just now";
		if (mins < 60) return `${mins}m ago`;
		const hrs = Math.floor(mins / 60);
		if (hrs < 24) return `${hrs}h ago`;
		const days = Math.floor(hrs / 24);
		if (days < 7) return `${days}d ago`;
		return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
	} catch {
		return "-";
	}
};

const formatTime = (date: string) => {
	try {
		const d = new Date(date);
		return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
	} catch {
		return "";
	}
};

export default function NoteCard({
	note,
	folders,
	colorClass,
	onOpen,
	onRename,
	onDelete,
	onMove,
}: NoteCardProps) {
	const folderName =
		note.folder && typeof note.folder === "object" ? note.folder.name : null;

	return (
		<div
			className={cn(
				"group relative flex h-full min-h-[200px] border border-gray-300 cursor-pointer flex-col rounded-2xl p-5 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg",
				colorClass
			)}
			onClick={() => onOpen(note._id)}
		>
			{/* Top row: folder badge & menu */}
			<div className="flex items-start justify-between gap-2">
				<div className="flex items-center gap-2">
					{folderName && (
						<span className="inline-flex items-center gap-1 rounded-full bg-black/[0.06] px-2.5 py-0.5 text-[11px] font-medium dark:bg-white/[0.08]">
							<Folder className="h-3 w-3" />
							{folderName}
						</span>
					)}
				</div>
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button
							variant="ghost"
							size="icon"
							className="h-7 w-7 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
							onClick={(e) => e.stopPropagation()}
						>
							<MoreHorizontal className="h-4 w-4" />
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end" className="w-44">
						<DropdownMenuItem onClick={(e) => { e.stopPropagation(); onRename(note); }}>
							<Pencil className="mr-2 h-4 w-4" />
							Rename
						</DropdownMenuItem>
						<DropdownMenuSeparator />
						<DropdownMenuItem onClick={(e) => { e.stopPropagation(); onMove(note._id, null); }}>
							<FolderInput className="mr-2 h-4 w-4" />
							Move to root
						</DropdownMenuItem>
						{folders.map((folder) => (
							<DropdownMenuItem
								key={folder._id}
								onClick={(e) => { e.stopPropagation(); onMove(note._id, folder._id); }}
								className={cn(
									note.folder &&
										typeof note.folder === "object" &&
										note.folder._id === folder._id &&
										"bg-accent"
								)}
							>
								<FolderInput className="mr-2 h-4 w-4" />
								{folder.name}
							</DropdownMenuItem>
						))}
						<DropdownMenuSeparator />
						<DropdownMenuItem
							variant="destructive"
							onClick={(e) => { e.stopPropagation(); onDelete(note._id); }}
						>
							<Trash2 className="mr-2 h-4 w-4" />
							Delete
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>

			{/* Title */}
			<h3 className="mt-3 line-clamp-2 text-[15px] font-bold leading-snug tracking-tight">
				{note.title}
			</h3>

			{/* Excerpt */}
			<p className="mt-2 flex-1 text-[13px] leading-relaxed opacity-65 line-clamp-3">
				{note.excerpt || "Empty note"}
			</p>

			{/* Footer */}
			<div className="mt-4 flex items-center justify-between border-t border-black/[0.06] pt-3 dark:border-white/[0.06]">
				<div className="flex items-center gap-1.5 text-[11px] font-medium opacity-55">
					<Clock className="h-3 w-3" />
					<span>{formatTime(note.updatedAt)}</span>
					<span className="mx-1">&middot;</span>
					<span>{formatDate(note.updatedAt)}</span>
				</div>
				<button
					className="flex h-7 w-7 items-center justify-center rounded-lg bg-black/[0.06] opacity-0 transition-all hover:bg-black/10 group-hover:opacity-100 dark:bg-white/[0.08] dark:hover:bg-white/15"
					onClick={(e) => {
						e.stopPropagation();
						onOpen(note._id);
					}}
				>
					<Pencil className="h-3.5 w-3.5" />
				</button>
			</div>
		</div>
	);
}
