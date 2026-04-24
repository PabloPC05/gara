import { useState, useCallback } from "react";

import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import {
	Carousel,
	CarouselContent,
	CarouselItem,
	type CarouselApi,
} from "@/components/ui/carousel";
import {
	AA_GROUP_MAP,
	AA_GROUP_COLORS,
	SCROLL_JUMP,
} from "../utils/fastaBarConstants";
import { ChevronLeft, ChevronRight } from "../utils/fastaBarIcons";

interface SequenceCarouselRowProps {
	proteinId: string | null;
	sequence: string;
	focusedSeqId: number | null;
	canSelect: boolean;
	onSelect: (proteinId: string, seqId: number) => void;
	onDeselect: (proteinId: string) => void;
	onApiReady?: (api: CarouselApi) => void;
	label?: string;
	showNav?: boolean;
	// Draft editing mode
	editSelectedIndex?: number | null;
	onEditSelect?: (index: number) => void;
}

export function SequenceCarouselRowLayout({
	proteinId,
	sequence,
	focusedSeqId,
	canSelect,
	onSelect,
	onDeselect,
	onApiReady,
	label,
	showNav,
	editSelectedIndex,
	onEditSelect,
}: SequenceCarouselRowProps) {
	const [rowApi, setRowApi] = useState<CarouselApi>(undefined);

	const handleApi = useCallback(
		(api: CarouselApi) => {
			setRowApi(api);
			onApiReady?.(api);
		},
		[onApiReady],
	);

	const scrollRowBy = useCallback(
		(jump: number) => {
			if (!rowApi) return;
			const target = Math.max(
				0,
				Math.min(
					rowApi.scrollSnapList().length - 1,
					rowApi.selectedScrollSnap() + jump,
				),
			);
			rowApi.scrollTo(target);
		},
		[rowApi],
	);

	const handleAAClick = useCallback(
		(i: number, isSelected: boolean) => {
			if (onEditSelect) {
				// Draft editing mode: clicking selects the amino acid for insertion context
				onEditSelect(i);
				return;
			}
			if (!canSelect) return;
			if (isSelected) onDeselect(proteinId!);
			else onSelect(proteinId!, i + 1);
		},
		[onEditSelect, canSelect, proteinId, onSelect, onDeselect],
	);

	const renderEmptySequence = () => (
		<CarouselItem className="basis-auto pl-0">
			<div className="flex h-[22px] items-center">
				<span className="flex items-center text-[11px] italic text-zinc-400">
					Sin secuencia
				</span>
			</div>
		</CarouselItem>
	);

	const renderAminoAcid = (letter: string, i: number) => {
		const group = AA_GROUP_MAP[letter] ?? "";
		const colors = AA_GROUP_COLORS[group];
		const isEditSelected =
			editSelectedIndex !== null && editSelectedIndex === i;
		const isViewSelected = focusedSeqId === i + 1 && canSelect;
		const isSelected = isEditSelected || isViewSelected;
		const isClickable = !!onEditSelect || canSelect;

		return (
			<CarouselItem key={i} className="shrink-0 basis-auto pl-0">
				<TooltipProvider delayDuration={0}>
					<Tooltip open={isSelected}>
						<TooltipTrigger asChild>
							<button
								data-selected={isSelected ? "true" : "false"}
								tabIndex={-1}
								onClick={() => handleAAClick(i, isViewSelected)}
								className={[
									"flex h-[22px] w-[18px] items-center justify-center rounded-[3px] font-mono text-[10px] font-bold shadow-sm transition-all duration-100",
									isClickable ? "cursor-pointer" : "cursor-default opacity-80",
								].join(" ")}
								style={{
									backgroundColor: isSelected ? colors.sel : colors.base,
									color: colors.text,
									outline: isSelected ? `2px solid ${colors.ring}` : "none",
									outlineOffset: "1px",
								}}
							>
								{letter}
							</button>
						</TooltipTrigger>
						<TooltipContent
							side="top"
							sideOffset={6}
							className="text-[10px] font-medium"
						>
							{`${letter} · pos ${i + 1}`}
						</TooltipContent>
					</Tooltip>
				</TooltipProvider>
			</CarouselItem>
		);
	};

	return (
		<div className="flex flex-col">
			{label && (
				<span className="truncate px-3 pt-0.5 text-[8px] font-bold uppercase tracking-[0.15em] text-zinc-400">
					{label}
				</span>
			)}
			<div className="flex min-w-0 items-stretch overflow-hidden">
				{showNav && (
					<button
						onClick={() => scrollRowBy(-SCROLL_JUMP)}
						className="flex w-6 shrink-0 items-center justify-center border-r border-zinc-200/50 text-zinc-400 transition-colors hover:bg-zinc-200/50 hover:text-zinc-600"
						aria-label="Anterior"
					>
						<ChevronLeft />
					</button>
				)}
				<Carousel
					setApi={handleApi}
					opts={{ align: "center", dragFree: true }}
					className="h-7 min-w-0 flex-1"
				>
					<CarouselContent className="ml-0 h-full items-center gap-1.5 px-3">
						{sequence.length === 0 ? (
							renderEmptySequence()
						) : (
							<>
								{[...sequence].map((letter, i) => renderAminoAcid(letter, i))}
							</>
						)}
					</CarouselContent>
				</Carousel>
				{showNav && (
					<button
						onClick={() => scrollRowBy(SCROLL_JUMP)}
						className="flex w-6 shrink-0 items-center justify-center border-l border-zinc-200/50 text-zinc-400 transition-colors hover:bg-zinc-200/50 hover:text-zinc-600"
						aria-label="Siguiente"
					>
						<ChevronRight />
					</button>
				)}
			</div>
		</div>
	);
}
