export const shellClass =
  "mx-auto grid min-h-screen w-[min(1520px,calc(100%-28px))] grid-rows-[auto_1fr] gap-2.5 pt-[62px] pb-2.5 antialiased max-[900px]:w-[min(calc(100%-20px),1520px)] max-[900px]:pt-[180px] print:block print:min-h-auto print:w-full print:bg-white print:p-0 print:pt-0";

export const glassPanelClass =
  "min-h-0 rounded-[22px] border border-slate-900/8 bg-white/86 p-3.5 shadow-[0_18px_42px_rgba(15,23,42,0.08)] backdrop-blur-[16px]";

export const appHeaderClass = `bg-white/30 backdrop-blur-[4px] py-3 px-8 fixed top-0 left-1/2 -translate-x-1/2 z-50 w-full flex flex-nowrap items-center justify-between print:hidden`;

export const workspaceClass =
  "grid min-h-0 gap-2.5 grid-cols-[minmax(360px,430px)_minmax(0,1fr)] max-[1280px]:grid-cols-1 print:block print:min-h-auto print:w-full print:gap-0";

export const flowRailClass = "grid min-h-0 auto-rows-max gap-2.5 print:hidden";

export const flowCardClass = `${glassPanelClass} grid content-start gap-2.5 overflow-hidden`;
export const advancedPanelClass = `${glassPanelClass} grid content-start gap-2.5 overflow-hidden`;
export const resultPanelClass = `${glassPanelClass} grid min-h-0 grid-rows-[auto_auto_auto_auto_1fr] gap-2.5 overflow-hidden print:block print:border-0 print:bg-white print:shadow-none`;
export const drawerPanelClass =
  "grid h-full w-[min(480px,100%)] grid-rows-[auto_1fr] gap-3.5 rounded-[22px] border border-slate-900/8 bg-white/86 p-4 shadow-[0_18px_42px_rgba(15,23,42,0.08)] backdrop-blur-[16px] max-[900px]:w-full";

export const sectionKickerClass =
  "mb-1 text-[0.8rem] font-extrabold uppercase tracking-[0.08em] text-amber-700";
export const heroTitleClass =
  "m-0 font-bold text-[clamp(1.1rem,2vw,1.5rem)] leading-[1]";
export const panelTitleClass = "m-0 text-[1.18rem] leading-[1.05]";
export const emptyTitleClass = "m-0 text-2xl";

export const headerSummaryClass =
  "flex items-stretch gap-2.5 flex-wrap max-[900px]:flex-col";
export const headerActionsClass =
  "col-span-full flex flex-wrap justify-end gap-2";
export const metricCardClass =
  "grid min-h-[74px] content-center gap-1 rounded-2xl border border-slate-400/15 bg-white/75 px-3 py-2.5";
export const metricCardStrongClass =
  "bg-[linear-gradient(135deg,rgba(15,23,42,0.95),rgba(20,83,45,0.9))] text-blue-50";
export const metricLabelClass = "text-[0.74rem] text-slate-500";
export const metricValueClass = "text-[0.96rem] font-semibold";

export const headRowClass = "flex items-start justify-between gap-2.5";
export const badgeClass =
  "inline-flex min-h-[26px] items-center justify-center whitespace-nowrap rounded-full bg-amber-100 px-2.5 text-[0.78rem] font-extrabold text-amber-800";

export const fieldClass = "grid gap-1.5";
export const fieldLabelClass = "text-[0.84rem] font-bold text-slate-700";
export const fieldRowClass = "grid grid-cols-2 gap-2.5 max-[900px]:grid-cols-1";
export const helperTextClass = "m-0 text-[0.84rem] text-slate-500 print:hidden";
export const warningTextClass =
  "m-0 text-[0.84rem] text-amber-700 print:hidden";
export const errorTextClass = "m-0 text-[0.84rem] text-red-700 print:hidden";
export const emptyCopyClass = "m-0 text-[0.84rem] text-slate-500";

export const warmSurfaceClass =
  "rounded-[18px] border border-amber-500/15 bg-[linear-gradient(180deg,rgba(255,250,240,0.9),rgba(255,255,255,0.84))]";
export const previewBoxClass = `${warmSurfaceClass} p-2.5`;
export const summaryCardClass = `${warmSurfaceClass} grid grid-cols-3 gap-2.5 p-2.5 max-[900px]:grid-cols-1`;
export const actionSummaryClass = `${warmSurfaceClass} grid grid-cols-2 gap-2.5 p-2.5 max-[900px]:grid-cols-1`;
export const subsectionClass = `${warmSurfaceClass} grid gap-2.5 p-2.5`;
export const resultToolbarClass = `${warmSurfaceClass} flex items-end justify-between gap-2.5 p-2.5 max-[900px]:flex-col max-[900px]:items-stretch print:hidden`;
export const resultMetaClass = `${warmSurfaceClass} flex justify-between gap-2.5 p-2.5 text-[0.82rem] text-slate-600 max-[900px]:flex-col max-[900px]:items-stretch print:hidden`;
export const emptyResultClass = `${warmSurfaceClass} grid min-h-[320px] place-content-center gap-2 p-2.5 text-center`;
export const previewMetaClass = "text-[0.76rem] text-slate-500";
export const summaryLabelClass = "text-[0.76rem] text-slate-500";
export const summaryValueClass =
  "mt-0.5 block text-[0.96rem] font-semibold text-slate-900";

export const chipListClass = "flex flex-wrap gap-1.5";
export const chipListScrollClass = "max-h-[88px] content-start overflow-auto";
export const chipClass =
  "inline-flex rounded-full border border-amber-400/25 bg-white px-2.5 py-1.5 text-[0.82rem] text-amber-900";

export const buttonRowClass = "flex flex-wrap gap-2";
export const ghostButtonClass =
  "min-h-[38px] rounded-full border border-slate-400/25 bg-white/90 px-3.5 font-extrabold text-slate-900 transition duration-200 hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none disabled:translate-y-0";
export const primaryButtonClass =
  "min-h-[38px] rounded-full bg-[linear-gradient(135deg,#0f766e,#2563eb)] px-3.5 font-extrabold text-white shadow-[0_10px_20px_rgba(37,99,235,0.24)] transition duration-200 hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none disabled:translate-y-0";
export const primaryButtonWideClass = `${primaryButtonClass} min-h-[50px] w-full text-base`;
export const recommendationChipClass =
  "grid min-h-12 content-center justify-items-start gap-0.5 rounded-[14px] border border-sky-500/20 bg-sky-50/90 px-2.5 py-2 text-left text-slate-900 transition duration-200 hover:-translate-y-px";
export const recommendationMetaClass = "text-[0.72rem] text-slate-500";
export const accordionButtonClass =
  "flex min-h-[38px] w-full items-center justify-between rounded-full border border-slate-400/25 bg-white/90 px-3.5 font-extrabold text-slate-900 transition duration-200 hover:-translate-y-px";

export const optionGroupClass = "grid gap-2";
export const checkboxRowClass = "inline-flex items-center gap-2 text-[0.84rem]";
export const checkboxChipClass =
  "inline-flex items-center gap-2 rounded-full border border-slate-400/25 bg-white/90 px-2.5 py-2 text-[0.84rem]";

export const layoutGridClass = "grid gap-1.5";
export const layoutCellBaseClass =
  "grid min-h-16 gap-0.5 rounded-[14px] border border-slate-400/20 px-1.5 py-2 text-left transition duration-200 hover:-translate-y-px";
export const layoutCellSeatClass = "bg-blue-50/95";
export const layoutCellAisleClass = "bg-slate-100/95";
export const layoutCellBlockedClass = "bg-rose-50/95";

export const listStackClass = "grid max-h-[220px] gap-2 overflow-auto";
export const listStackShortClass = "max-h-[150px]";
export const drawerListClass = "max-h-none";
export const listCardClass = `${warmSurfaceClass} flex items-start justify-between gap-2.5 p-2.5`;
export const listCardTitleClass =
  "block text-[0.88rem] font-semibold text-slate-900";
export const listCardMetaClass = "text-[0.74rem] text-slate-500";

export const searchFieldClass =
  "grid min-w-[min(320px,100%)] gap-1.5 max-[900px]:min-w-full";
export const seatBoardClass =
  "min-h-0 overflow-auto pr-1 print:overflow-visible print:pr-0";
export const seatGridClass = "grid gap-2";
export const resultSeatGridClass = "min-w-max";
export const seatGridDrawingClass = "opacity-65";
export const seatCardClass =
  "grid min-h-24 content-start gap-1 rounded-2xl border border-blue-500/15 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(239,246,255,0.92))] p-3";
export const seatCardInactiveClass = "border-dashed bg-slate-100/95";
export const seatCardFixedClass =
  "border-amber-500/45 bg-[linear-gradient(180deg,rgba(255,251,235,0.96),rgba(255,255,255,0.9))]";
export const seatCardHighlightClass =
  "outline-3 outline-blue-500/25 shadow-[0_0_0_4px_rgba(125,211,252,0.12)]";
export const seatLabelClass = "text-[0.74rem] font-extrabold text-teal-700";

export const drawerBackdropClass =
  "fixed inset-0 z-20 flex justify-end bg-slate-900/40 p-[18px] backdrop-blur-[8px] max-[900px]:p-2.5 print:hidden";
export const drawerBodyClass = "grid min-h-0 content-start gap-3";
