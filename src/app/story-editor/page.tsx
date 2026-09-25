"use client";

import {
  ArrowDownTrayIcon,
  ArrowPathIcon,
  ArrowUpTrayIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronUpIcon,
  CodeBracketIcon,
  EyeIcon,
  EyeSlashIcon,
  MapPinIcon,
  PhotoIcon,
  PlusIcon,
  SparklesIcon,
  Squares2X2Icon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { ChangeEvent, PointerEvent as ReactPointerEvent, useEffect, useMemo, useRef, useState } from "react";
import styles from "./story-editor.module.css";

const STAGE_WIDTH = 1200;
const STAGE_HEIGHT = 675;
const BACKGROUND_ID = "background";

type Point = { x: number; y: number };

type StoryElement = {
  id: string;
  name: string;
  src: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  visible: boolean;
  classes: string[];
  annotation: string;
  storyTitle?: string;
  storySubtitle?: string;
  storyText?: string;
  storyLocation?: string;
  storyTime?: string;
  originalSrc?: string;
  removeBackground?: boolean;
  outline?: boolean;
  edgePath?: string;
  sourceWidth?: number;
  sourceHeight?: number;
};

type StoryScene = {
  id: string;
  title: string;
  subtitle: string;
  text: string;
  location: string;
  time: string;
  background: string;
  backgroundOriginal?: string;
  backgroundRemove?: boolean;
  backgroundOutline?: boolean;
  backgroundEdgePath?: string;
  backgroundSourceWidth?: number;
  backgroundSourceHeight?: number;
  backgroundX?: number;
  backgroundY?: number;
  backgroundWidth?: number;
  backgroundHeight?: number;
  backgroundRotation?: number;
  backgroundOpacity?: number;
  backgroundVisible?: boolean;
  backgroundAnnotation?: string;
  elements: StoryElement[];
  map?: {
    title: string;
    mapyear: number;
    start: { lat: number; lon: number };
    end: { lat: number; lon: number };
  };
};

const initialScenes: StoryScene[] = [
  {
    id: "opening_scene",
    title: "An untitled story",
    subtitle: "Opening scene",
    text: "Write the annotation for the whole scene here.",
    location: "Odense, Denmark",
    time: "1943",
    background: "/images/new/background.svg",
    backgroundX: 0,
    backgroundY: 0,
    backgroundWidth: STAGE_WIDTH,
    backgroundHeight: STAGE_HEIGHT,
    backgroundRotation: 0,
    backgroundOpacity: 1,
    backgroundVisible: true,
    backgroundAnnotation: "",
    elements: [
      {
        id: "witness",
        name: "Witness portrait",
        src: "/images/steen_icon.png",
        x: 486,
        y: 212,
        width: 228,
        height: 228,
        rotation: 0,
        opacity: 1,
        visible: true,
        classes: ["myimage"],
        annotation: "Add the story connected to this element.",
        storyTitle: "An untitled story",
        storySubtitle: "Witness portrait",
        storyText: "Add the story connected to this element.",
        storyLocation: "Odense, Denmark",
        storyTime: "1943",
      },
    ],
    map: {
      title: "Scene location",
      mapyear: 1943,
      start: { lat: 55.4038, lon: 10.4024 },
      end: { lat: 50.5106, lon: 14.1498 },
    },
  },
];

function cleanId(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "") || "element";
}

function uniqueId(base: string, taken: string[]) {
  const clean = cleanId(base);
  let candidate = clean;
  let suffix = 2;
  while (taken.includes(candidate)) candidate = `${clean}_${suffix++}`;
  return candidate;
}

function esc(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function scenesToStoryData(scenes: StoryScene[]) {
  const entries: Array<[string, Record<string, unknown>]> = [];
  scenes.forEach((scene) => {
    entries.push([scene.id, {
      title: scene.title,
      subtitle: scene.subtitle,
      text: scene.text,
      location: scene.location,
      time: scene.time,
      svgFile: `/images/${scene.id}.svg`,
      ...(scene.map ? { map: scene.map } : {}),
    }]);
    scene.elements.forEach((element) => {
      entries.push([`${cleanId(element.id)}_x5F_group`, {
        title: element.storyTitle ?? scene.title,
        subtitle: element.storySubtitle ?? element.name,
        text: element.storyText ?? element.annotation,
        location: element.storyLocation ?? scene.location,
        time: element.storyTime ?? scene.time,
      }]);
    });
  });
  return Object.fromEntries(entries);
}

function storyDataToScenes(input: unknown, currentScenes: StoryScene[] = []): StoryScene[] {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error("The root JSON value must be an object.");
  const entries = Object.entries(input as Record<string, any>);
  if (!entries.length) throw new Error("Add at least one scene.");
  const isLegacyEditorData = entries.some(([, value]) => value?.scene);
  if (!isLegacyEditorData) {
    const sceneEntries = entries.filter(([key, value]) => currentScenes.some((scene) => scene.id === key) || typeof value?.svgFile === "string");
    if (!sceneEntries.length) throw new Error("No scene entries were found. A scene needs an svgFile or a matching scene ID.");
    return sceneEntries.map(([key, value]) => {
      const existing = currentScenes.find((scene) => scene.id === key);
      const elements = (existing?.elements ?? []).map((element) => {
        const story = (input as Record<string, any>)[`${cleanId(element.id)}_x5F_group`];
        return story ? {
          ...element,
          storyTitle: String(story.title ?? element.storyTitle ?? existing?.title ?? ""),
          storySubtitle: String(story.subtitle ?? element.storySubtitle ?? element.name),
          storyText: String(story.text ?? element.storyText ?? element.annotation),
          storyLocation: String(story.location ?? element.storyLocation ?? existing?.location ?? ""),
          storyTime: String(story.time ?? element.storyTime ?? existing?.time ?? ""),
          annotation: String(story.text ?? element.annotation),
        } : element;
      });
      return {
        ...(existing ?? { id: cleanId(key), background: "", elements: [] }),
        id: cleanId(key),
        title: String(value?.title ?? existing?.title ?? "Untitled scene"),
        subtitle: String(value?.subtitle ?? existing?.subtitle ?? ""),
        text: String(value?.text ?? existing?.text ?? ""),
        location: String(value?.location ?? existing?.location ?? ""),
        time: String(value?.time ?? existing?.time ?? ""),
        map: value?.map ?? existing?.map,
        elements,
      };
    });
  }
  return entries.map(([key, value]) => {
    const scene = value?.scene ?? {};
    const background = scene.background && typeof scene.background === "object" && !Array.isArray(scene.background) ? scene.background : null;
    return {
      id: cleanId(key),
      title: String(value?.title ?? "Untitled scene"),
      subtitle: String(value?.subtitle ?? ""),
      text: String(value?.text ?? ""),
      location: String(value?.location ?? ""),
      time: String(value?.time ?? ""),
      background: String(background?.src ?? scene.background ?? ""),
      backgroundOriginal: background?.originalSrc ? String(background.originalSrc) : scene.backgroundOriginal ? String(scene.backgroundOriginal) : undefined,
      backgroundRemove: Boolean(background?.removeBackground ?? scene.backgroundRemove),
      backgroundOutline: Boolean(background?.outline ?? scene.backgroundOutline),
      backgroundEdgePath: background?.edgePath ?? scene.backgroundEdgePath,
      backgroundSourceWidth: Number(background?.sourceWidth ?? scene.backgroundSourceWidth) || undefined,
      backgroundSourceHeight: Number(background?.sourceHeight ?? scene.backgroundSourceHeight) || undefined,
      backgroundX: Number(background?.x ?? 0),
      backgroundY: Number(background?.y ?? 0),
      backgroundWidth: Number(background?.width ?? STAGE_WIDTH),
      backgroundHeight: Number(background?.height ?? STAGE_HEIGHT),
      backgroundRotation: Number(background?.rotation ?? 0),
      backgroundOpacity: Number(background?.opacity ?? 1),
      backgroundVisible: background?.visible !== false,
      backgroundAnnotation: String(background?.annotation ?? ""),
      map: value?.map,
      elements: Array.isArray(scene.elements)
        ? scene.elements.map((element: any, index: number) => ({
            id: cleanId(String(element.id ?? `element_${index + 1}`)),
            name: String(element.name ?? `Element ${index + 1}`),
            src: String(element.src ?? ""),
            x: Number(element.x ?? 100),
            y: Number(element.y ?? 100),
            width: Number(element.width ?? 240),
            height: Number(element.height ?? 180),
            rotation: Number(element.rotation ?? 0),
            opacity: Number(element.opacity ?? 1),
            visible: element.visible !== false,
            classes: Array.isArray(element.classes) ? element.classes.map(String).filter((className: string) => className !== "interactive") : ["myimage"],
            annotation: String(element.annotation ?? ""),
            storyTitle: element.storyTitle ? String(element.storyTitle) : undefined,
            storySubtitle: element.storySubtitle ? String(element.storySubtitle) : undefined,
            storyText: element.storyText ? String(element.storyText) : undefined,
            storyLocation: element.storyLocation ? String(element.storyLocation) : undefined,
            storyTime: element.storyTime ? String(element.storyTime) : undefined,
            originalSrc: element.originalSrc ? String(element.originalSrc) : undefined,
            removeBackground: Boolean(element.removeBackground),
            outline: Boolean(element.outline),
            edgePath: element.edgePath,
            sourceWidth: element.sourceWidth,
            sourceHeight: element.sourceHeight,
          }))
        : [],
    };
  });
}

function download(name: string, content: BlobPart, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  URL.revokeObjectURL(url);
}

function convexHull(points: Point[]) {
  if (points.length < 3) return points;
  const sorted = points.sort((a, b) => a.x - b.x || a.y - b.y);
  const cross = (o: Point, a: Point, b: Point) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
  const lower: Point[] = [];
  for (const point of sorted) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], point) <= 0) lower.pop();
    lower.push(point);
  }
  const upper: Point[] = [];
  for (let i = sorted.length - 1; i >= 0; i--) {
    const point = sorted[i];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], point) <= 0) upper.pop();
    upper.push(point);
  }
  return lower.slice(0, -1).concat(upper.slice(0, -1));
}

async function fileToDataUrl(file: Blob) {
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

async function prepareSource(original: string, removeWhite: boolean) {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const node = new Image();
    node.onload = () => resolve(node);
    node.onerror = reject;
    node.src = original;
  });
  const scale = Math.min(1, 900 / Math.max(image.naturalWidth, image.naturalHeight));
  const width = Math.max(1, Math.round(image.naturalWidth * scale));
  const height = Math.max(1, Math.round(image.naturalHeight * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("Canvas is not available in this browser.");
  context.drawImage(image, 0, 0, width, height);
  const pixels = context.getImageData(0, 0, width, height);
  if (removeWhite) {
    for (let index = 0; index < pixels.data.length; index += 4) {
      const whiteness = Math.min(pixels.data[index], pixels.data[index + 1], pixels.data[index + 2]);
      if (whiteness > 245) pixels.data[index + 3] = 0;
      else if (whiteness > 225) pixels.data[index + 3] = Math.round(pixels.data[index + 3] * ((245 - whiteness) / 20));
    }
    context.putImageData(pixels, 0, 0);
  }
  const bounds = { left: width, top: height, right: 0, bottom: 0 };
  const boundary: Point[] = [];
  const alphaAt = (x: number, y: number) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return 0;
    const index = (y * width + x) * 4;
    const white = Math.min(pixels.data[index], pixels.data[index + 1], pixels.data[index + 2]) > 245;
    return white ? 0 : pixels.data[index + 3];
  };
  for (let y = 0; y < height; y += 2) {
    for (let x = 0; x < width; x += 2) {
      if (alphaAt(x, y) > 24) {
        bounds.left = Math.min(bounds.left, x);
        bounds.top = Math.min(bounds.top, y);
        bounds.right = Math.max(bounds.right, x);
        bounds.bottom = Math.max(bounds.bottom, y);
        if (alphaAt(x - 2, y) <= 24 || alphaAt(x + 2, y) <= 24 || alphaAt(x, y - 2) <= 24 || alphaAt(x, y + 2) <= 24) boundary.push({ x, y });
      }
    }
  }
  if (bounds.right <= bounds.left || bounds.bottom <= bounds.top) return { src: original, width, height, edgePath: "" };
  const padding = 3;
  const left = Math.max(0, bounds.left - padding);
  const top = Math.max(0, bounds.top - padding);
  const cropWidth = Math.min(width - left, bounds.right - bounds.left + padding * 2);
  const cropHeight = Math.min(height - top, bounds.bottom - bounds.top + padding * 2);
  const cropped = document.createElement("canvas");
  cropped.width = cropWidth;
  cropped.height = cropHeight;
  cropped.getContext("2d")?.drawImage(canvas, left, top, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);
  const hull = convexHull(boundary.map((point) => ({ x: point.x - left, y: point.y - top })));
  if (!removeWhite) {
    const fullHull = convexHull(boundary);
    const edgePath = fullHull.length ? `M ${fullHull.map((point) => `${point.x},${point.y}`).join(" L ")} Z` : "";
    return { src: original, width, height, edgePath };
  }
  const edgePath = hull.length ? `M ${hull.map((point) => `${point.x},${point.y}`).join(" L ")} Z` : "";
  return { src: cropped.toDataURL("image/png"), width: cropWidth, height: cropHeight, edgePath };
}

async function prepareImage(file: File, removeWhite: boolean) {
  const original = await fileToDataUrl(file);
  return { ...(await prepareSource(original, removeWhite)), original };
}

async function embeddedImageSource(source: string) {
  if (!source || source.startsWith("data:")) return source;
  const response = await fetch(source);
  if (!response.ok) throw new Error(`Could not load image source: ${source}`);
  return fileToDataUrl(await response.blob());
}

function buildSvg(scene: StoryScene) {
  const groups = scene.elements.map((element) => {
    const groupId = `${cleanId(element.id)}_x5F_group`;
    const classes = Array.from(new Set(["interactive-element", ...element.classes.filter((className) => className !== "interactive"), ...(element.visible ? [] : ["hidden"])] as string[])).join(" ");
    const sx = element.sourceWidth ? element.width / element.sourceWidth : 1;
    const sy = element.sourceHeight ? element.height / element.sourceHeight : 1;
    const pathClass = element.outline ? "myPath shaped-outline" : "myPath";
    const path = element.edgePath
      ? `<path id="${cleanId(element.id)}_x5F_path" class="${pathClass}" d="${element.edgePath}" transform="scale(${sx} ${sy})"${element.outline ? ` style="fill:none;stroke:#171717;stroke-width:2px"` : ""}/>`
      : `<path id="${cleanId(element.id)}_x5F_path" class="${pathClass}" d="M 0,0 H ${element.width} V ${element.height} H 0 Z"${element.outline ? ` style="fill:none;stroke:#171717;stroke-width:2px"` : ""}/>`;
    return `<g id="${groupId}" class="${esc(classes)}" opacity="${element.opacity}" data-annotation="${esc(element.storyText ?? element.annotation)}">
  <g transform="translate(${element.x} ${element.y}) rotate(${element.rotation} ${element.width / 2} ${element.height / 2})">
  <image id="${cleanId(element.id)}_x5F_image" class="myimage" href="${esc(element.src)}" width="${element.width}" height="${element.height}" preserveAspectRatio="none"/>
  ${path}
  </g>
</g>`;
  }).join("\n");
  const backgroundWidth = scene.backgroundWidth ?? STAGE_WIDTH;
  const backgroundHeight = scene.backgroundHeight ?? STAGE_HEIGHT;
  const backgroundScaleX = scene.backgroundSourceWidth ? backgroundWidth / scene.backgroundSourceWidth : 1;
  const backgroundScaleY = scene.backgroundSourceHeight ? backgroundHeight / scene.backgroundSourceHeight : 1;
  const backgroundPath = scene.backgroundOutline && scene.backgroundEdgePath
    ? `<path id="background_x5F_outline" class="shaped-outline" d="${scene.backgroundEdgePath}" transform="scale(${backgroundScaleX} ${backgroundScaleY})" style="fill:none;stroke:#171717;stroke-width:2px"/>`
    : "";
  const backgroundGroup = scene.background
    ? `<g id="background_x5F_group" class="inactive${scene.backgroundVisible === false ? " hidden" : ""}" opacity="${scene.backgroundOpacity ?? 1}" data-annotation="${esc(scene.backgroundAnnotation ?? "")}">
  <g transform="translate(${scene.backgroundX ?? 0} ${scene.backgroundY ?? 0}) rotate(${scene.backgroundRotation ?? 0} ${backgroundWidth / 2} ${backgroundHeight / 2})">
  <image id="background_x5F_image" href="${esc(scene.background)}" width="${backgroundWidth}" height="${backgroundHeight}" preserveAspectRatio="none"/>
  ${backgroundPath}
  </g>
</g>`
    : "";
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${STAGE_WIDTH} ${STAGE_HEIGHT}" width="${STAGE_WIDTH}" height="${STAGE_HEIGHT}" role="img" aria-label="${esc(scene.title)}">
<title>${esc(scene.title)}</title>
<desc>${esc(scene.text)}</desc>
${backgroundGroup}
${groups}
</svg>`;
}

function WorldPicker({ scene, onChange }: { scene: StoryScene; onChange: (scene: StoryScene) => void }) {
  const [target, setTarget] = useState<"start" | "end">("start");
  const point = scene.map?.[target] ?? { lat: 0, lon: 0 };
  function choose(event: ReactPointerEvent<SVGSVGElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const lon = ((event.clientX - rect.left) / rect.width) * 360 - 180;
    const lat = 90 - ((event.clientY - rect.top) / rect.height) * 180;
    const map = scene.map ?? { title: "Scene route", mapyear: 1943, start: { lat: 0, lon: 0 }, end: { lat: 0, lon: 0 } };
    onChange({ ...scene, map: { ...map, [target]: { lat: Number(lat.toFixed(5)), lon: Number(lon.toFixed(5)) } } });
  }
  return (
    <div className={styles.mapCard}>
      <div className={styles.segmented}>
        <button className={target === "start" ? styles.activeSegment : ""} onClick={() => setTarget("start")}>Start</button>
        <button className={target === "end" ? styles.activeSegment : ""} onClick={() => setTarget("end")}>End</button>
      </div>
      <svg viewBox="0 0 360 180" onPointerDown={choose} aria-label="Choose a coordinate on the map">
        <rect width="360" height="180" rx="10" className={styles.mapOcean} />
        <path className={styles.mapLand} d="M20 38l35-20 45 7 20 22-16 18-3 33-24 14-15-29-30-12zm92 91 19-26 21 13-3 42-15 18-14-22zm50-91 29-18 65 2 23 18 40 10 26 27-26 20-34-8-23 16-31-12-16-29-30-7zm69 74 21-5 19 18-9 40-20-10-14-26zm75 31 29-9 16 19-21 14-26-9z" />
        {[60, 120, 180, 240, 300].map((x) => <line key={`x${x}`} x1={x} y1="0" x2={x} y2="180" className={styles.mapGrid} />)}
        {[45, 90, 135].map((y) => <line key={`y${y}`} x1="0" y1={y} x2="360" y2={y} className={styles.mapGrid} />)}
        <circle cx={point.lon + 180} cy={90 - point.lat} r="5" className={styles.mapMarker} />
      </svg>
      <div className={styles.coordinate}><MapPinIcon /> {point.lat.toFixed(4)}, {point.lon.toFixed(4)}</div>
    </div>
  );
}

export default function StoryEditorPage() {
  const [scenes, setScenes] = useState<StoryScene[]>(initialScenes);
  const [sceneIndex, setSceneIndex] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [jsonText, setJsonText] = useState(() => JSON.stringify(scenesToStoryData(initialScenes), null, 2));
  const [jsonError, setJsonError] = useState("");
  const [processing, setProcessing] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [saved, setSaved] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);
  const editingTextRef = useRef(false);
  const dragRef = useRef<{ id: string; mode: "move" | "resize"; startX: number; startY: number; x: number; y: number; width: number; height: number } | null>(null);
  const backgroundInput = useRef<HTMLInputElement>(null);
  const elementInput = useRef<HTMLInputElement>(null);
  const importInput = useRef<HTMLInputElement>(null);

  const scene = scenes[Math.min(sceneIndex, scenes.length - 1)];
  const backgroundElement: StoryElement | null = scene?.background ? {
    id: BACKGROUND_ID,
    name: "Background",
    src: scene.background,
    x: scene.backgroundX ?? 0,
    y: scene.backgroundY ?? 0,
    width: scene.backgroundWidth ?? STAGE_WIDTH,
    height: scene.backgroundHeight ?? STAGE_HEIGHT,
    rotation: scene.backgroundRotation ?? 0,
    opacity: scene.backgroundOpacity ?? 1,
    visible: scene.backgroundVisible !== false,
    classes: ["inactive"],
    annotation: scene.backgroundAnnotation ?? "",
    originalSrc: scene.backgroundOriginal,
    removeBackground: scene.backgroundRemove,
    outline: scene.backgroundOutline,
    edgePath: scene.backgroundEdgePath,
    sourceWidth: scene.backgroundSourceWidth,
    sourceHeight: scene.backgroundSourceHeight,
  } : null;
  const selected = selectedId === BACKGROUND_ID ? backgroundElement : scene?.elements.find((element) => element.id === selectedId) ?? null;
  const selectedIsBackground = selectedId === BACKGROUND_ID && Boolean(backgroundElement);
  const selectedStoryElement = selected && !selectedIsBackground ? selected : null;
  const storyMetadata = selectedStoryElement ? {
    title: selectedStoryElement.storyTitle ?? scene.title,
    subtitle: selectedStoryElement.storySubtitle ?? selectedStoryElement.name,
    text: selectedStoryElement.storyText ?? selectedStoryElement.annotation,
    location: selectedStoryElement.storyLocation ?? scene.location,
    time: selectedStoryElement.storyTime ?? scene.time,
  } : scene;

  useEffect(() => {
    if (editingTextRef.current) return;
    setJsonText(JSON.stringify(scenesToStoryData(scenes), null, 2));
    setSaved(false);
  }, [scenes]);

  function beginTextEdit() {
    editingTextRef.current = true;
  }

  function finishTextEdit() {
    editingTextRef.current = false;
    setJsonText(JSON.stringify(scenesToStoryData(scenes), null, 2));
    setSaved(false);
  }

  async function exportSceneSvg() {
    setProcessing(true);
    try {
      const [background, ...elementSources] = await Promise.all([
        embeddedImageSource(scene.background),
        ...scene.elements.map((element) => embeddedImageSource(element.src)),
      ]);
      const embeddedScene: StoryScene = {
        ...scene,
        background,
        elements: scene.elements.map((element, index) => ({ ...element, src: elementSources[index] })),
      };
      download(`${scene.id}.svg`, buildSvg(embeddedScene), "image/svg+xml");
    } finally {
      setProcessing(false);
    }
  }

  function updateScene(next: StoryScene) {
    setScenes((current) => current.map((item, index) => index === sceneIndex ? next : item));
  }

  function updateSelected(changes: Partial<StoryElement>) {
    if (!selectedId) return;
    if (selectedId === BACKGROUND_ID && backgroundElement) {
      const next = { ...backgroundElement, ...changes, id: BACKGROUND_ID, name: "Background", classes: ["inactive"] };
      updateScene({
        ...scene,
        background: next.src,
        backgroundOriginal: next.originalSrc,
        backgroundRemove: next.removeBackground,
        backgroundOutline: next.outline,
        backgroundEdgePath: next.edgePath,
        backgroundSourceWidth: next.sourceWidth,
        backgroundSourceHeight: next.sourceHeight,
        backgroundX: next.x,
        backgroundY: next.y,
        backgroundWidth: next.width,
        backgroundHeight: next.height,
        backgroundRotation: next.rotation,
        backgroundOpacity: next.opacity,
        backgroundVisible: next.visible,
        backgroundAnnotation: next.annotation,
      });
      return;
    }
    updateScene({ ...scene, elements: scene.elements.map((element) => element.id === selectedId ? { ...element, ...changes } : element) });
  }

  function updateStoryMetadata(field: "title" | "subtitle" | "text" | "location" | "time", value: string) {
    if (!selectedStoryElement) {
      updateScene({ ...scene, [field]: value });
      return;
    }
    const keys = {
      title: "storyTitle",
      subtitle: "storySubtitle",
      text: "storyText",
      location: "storyLocation",
      time: "storyTime",
    } as const;
    updateSelected({ [keys[field]]: value, ...(field === "text" ? { annotation: value } : {}) });
  }

  async function uploadBackground(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setProcessing(true);
    try {
      const prepared = await prepareImage(file, false);
      updateScene({
        ...scene,
        background: prepared.src,
        backgroundOriginal: prepared.original,
        backgroundRemove: false,
        backgroundOutline: false,
        backgroundEdgePath: prepared.edgePath,
        backgroundSourceWidth: prepared.width,
        backgroundSourceHeight: prepared.height,
        backgroundX: 0,
        backgroundY: 0,
        backgroundWidth: STAGE_WIDTH,
        backgroundHeight: STAGE_HEIGHT,
        backgroundRotation: 0,
        backgroundOpacity: 1,
        backgroundVisible: true,
        backgroundAnnotation: "",
      });
      setSelectedId(BACKGROUND_ID);
    } finally {
      setProcessing(false);
      event.target.value = "";
    }
  }

  async function uploadElements(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    if (!files.length) return;
    setProcessing(true);
    try {
      const taken = scene.elements.map((element) => element.id);
      const additions: StoryElement[] = [];
      for (const file of files) {
        const prepared = await prepareImage(file, false);
        const id = uniqueId(file.name.replace(/\.[^.]+$/, ""), [...taken, ...additions.map((item) => item.id)]);
        const displayWidth = Math.min(320, prepared.width);
        additions.push({
          id,
          name: file.name.replace(/\.[^.]+$/, ""),
          src: prepared.src,
          x: 440 + additions.length * 26,
          y: 180 + additions.length * 26,
          width: displayWidth,
          height: Math.round(displayWidth * prepared.height / prepared.width),
          rotation: 0,
          opacity: 1,
          visible: true,
          classes: ["myimage"],
          annotation: "",
          storyTitle: scene.title,
          storySubtitle: file.name.replace(/\.[^.]+$/, ""),
          storyText: "",
          storyLocation: scene.location,
          storyTime: scene.time,
          originalSrc: prepared.original,
          removeBackground: false,
          outline: false,
          edgePath: prepared.edgePath,
          sourceWidth: prepared.width,
          sourceHeight: prepared.height,
        });
      }
      updateScene({ ...scene, elements: [...scene.elements, ...additions] });
      setSelectedId(additions[additions.length - 1].id);
    } finally {
      setProcessing(false);
      event.target.value = "";
    }
  }

  async function setElementRemoval(enabled: boolean) {
    if (!selected) return;
    const source = selected.originalSrc ?? selected.src;
    setProcessing(true);
    try {
      const prepared = await prepareSource(source, enabled);
      updateSelected({
        src: prepared.src,
        originalSrc: source,
        removeBackground: enabled,
        edgePath: prepared.edgePath,
        sourceWidth: prepared.width,
        sourceHeight: prepared.height,
        height: selected.width * prepared.height / prepared.width,
      });
    } finally {
      setProcessing(false);
    }
  }

  async function setElementOutline(enabled: boolean) {
    if (!selected) return;
    if (!enabled || selected.edgePath) {
      updateSelected({ outline: enabled });
      return;
    }
    const source = selected.originalSrc ?? selected.src;
    setProcessing(true);
    try {
      const prepared = await prepareSource(source, Boolean(selected.removeBackground));
      updateSelected({ outline: true, edgePath: prepared.edgePath, sourceWidth: prepared.width, sourceHeight: prepared.height });
    } finally {
      setProcessing(false);
    }
  }

  function pointerDown(event: ReactPointerEvent, element: StoryElement, mode: "move" | "resize") {
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    setSelectedId(element.id);
    dragRef.current = { id: element.id, mode, startX: event.clientX, startY: event.clientY, x: element.x, y: element.y, width: element.width, height: element.height };
  }

  function pointerMove(event: ReactPointerEvent) {
    const drag = dragRef.current;
    const rect = stageRef.current?.getBoundingClientRect();
    if (!drag || !rect) return;
    const dx = (event.clientX - drag.startX) * STAGE_WIDTH / rect.width;
    const dy = (event.clientY - drag.startY) * STAGE_HEIGHT / rect.height;
    if (drag.mode === "move") {
      updateSelected({ x: Math.max(-drag.width + 20, Math.min(STAGE_WIDTH - 20, drag.x + dx)), y: Math.max(-drag.height + 20, Math.min(STAGE_HEIGHT - 20, drag.y + dy)) });
    } else {
      const ratio = drag.width / drag.height;
      const width = Math.max(40, drag.width + dx);
      updateSelected({ width, height: width / ratio });
    }
  }

  function finishPointer() { dragRef.current = null; }

  function deleteSelected() {
    if (!selected) return;
    if (selectedIsBackground) {
      updateScene({
        ...scene,
        background: "",
        backgroundOriginal: undefined,
        backgroundRemove: undefined,
        backgroundOutline: undefined,
        backgroundEdgePath: undefined,
        backgroundSourceWidth: undefined,
        backgroundSourceHeight: undefined,
        backgroundX: undefined,
        backgroundY: undefined,
        backgroundWidth: undefined,
        backgroundHeight: undefined,
        backgroundRotation: undefined,
        backgroundOpacity: undefined,
        backgroundVisible: undefined,
        backgroundAnnotation: undefined,
      });
    } else {
      updateScene({ ...scene, elements: scene.elements.filter((item) => item.id !== selected.id) });
    }
    setSelectedId(null);
  }

  function addScene() {
    const id = uniqueId(`scene_${scenes.length + 1}`, scenes.map((item) => item.id));
    const next: StoryScene = { id, title: "Untitled scene", subtitle: "New chapter", text: "Add the scene annotation.", location: "", time: "", background: "", elements: [] };
    setScenes([...scenes, next]);
    setSceneIndex(scenes.length);
    setSelectedId(null);
  }

  function deleteScene() {
    if (scenes.length <= 1) return;
    const nextScenes = scenes.filter((_, index) => index !== sceneIndex);
    const nextIndex = Math.min(sceneIndex, nextScenes.length - 1);
    setScenes(nextScenes);
    setSceneIndex(nextIndex);
    setSelectedId(null);
  }

  function moveScene(direction: number) {
    const target = sceneIndex + direction;
    if (target < 0 || target >= scenes.length) return;
    const next = [...scenes];
    [next[sceneIndex], next[target]] = [next[target], next[sceneIndex]];
    setScenes(next);
    setSceneIndex(target);
  }

  function moveLayer(id: string, direction: number) {
    const index = scene.elements.findIndex((element) => element.id === id);
    const target = index + direction;
    if (target < 0 || target >= scene.elements.length) return;
    const next = [...scene.elements];
    [next[index], next[target]] = [next[target], next[index]];
    updateScene({ ...scene, elements: next });
  }

  function applyJson() {
    try {
      const parsed = storyDataToScenes(JSON.parse(jsonText), scenes);
      setScenes(parsed);
      setSceneIndex(0);
      setSelectedId(null);
      setJsonError("");
    } catch (error) {
      setJsonError(error instanceof Error ? error.message : "Invalid JSON");
    }
  }

  async function importJson(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    setJsonText(text);
    try {
      const parsed = storyDataToScenes(JSON.parse(text), scenes);
      setScenes(parsed);
      setSceneIndex(0);
      setSelectedId(null);
      setJsonError("");
    } catch (error) {
      setJsonError(error instanceof Error ? error.message : "Invalid JSON");
    }
    event.target.value = "";
  }

  const progress = useMemo(() => {
    const checks = [scene.background, scene.title, scene.text, scene.location, scene.elements.length > 0, scene.elements.every((item) => item.storyText ?? item.annotation)];
    return Math.round(checks.filter(Boolean).length / checks.length * 100);
  }, [scene]);

  if (!scene) return null;

  return (
    <main className={styles.editor}>
      <header className={styles.topbar}>
        <div className={styles.brand}><span className={styles.brandMark}>M</span><b>Story editor</b></div>
        <div className={styles.sceneMeta}><span>Scene {sceneIndex + 1} of {scenes.length}</span><b>{scene.title}</b><div className={styles.progress} title={`${progress}% ready`}><i style={{ width: `${progress}%` }} /></div></div>
        <div className={styles.topActions}>
          <button className={styles.ghostButton} onClick={() => importInput.current?.click()}><ArrowUpTrayIcon /> Import</button>
          <button className={styles.ghostButton} onClick={() => { localStorage.setItem("memorise-story-draft", jsonText); setSaved(true); }}><span className={saved ? styles.savedDot : styles.unsavedDot} />{saved ? "Saved" : "Save draft"}</button>
          <button className={styles.primaryButton} disabled={processing} onClick={exportSceneSvg}><ArrowDownTrayIcon /> {processing ? "Preparing…" : "Export scene"}</button>
        </div>
      </header>

      <section className={styles.workspace}>
        <aside className={styles.toolsPanel}>
          <div className={styles.panelHeading}>
            <h2>Build your scene</h2>
            <div className={styles.panelActions}>
              <button className={styles.deleteButton} disabled={scenes.length <= 1} onClick={deleteScene} title={scenes.length <= 1 ? "A story needs at least one scene" : "Delete this scene"}><TrashIcon /> Delete scene</button>
              <span className={styles.count}>{scene.elements.length + (scene.background ? 1 : 0)}</span>
            </div>
          </div>
          <div className={styles.uploadCard} onClick={() => backgroundInput.current?.click()}>
            <div className={styles.uploadIcon}><PhotoIcon /></div><div><b>Background image</b><span>{scene.background ? "Replace the current backdrop" : "JPG, PNG, WebP or SVG"}</span></div><ChevronRightIcon />
          </div>
          <div className={styles.uploadCard} onClick={() => !processing && elementInput.current?.click()}>
            <div className={`${styles.uploadIcon} ${styles.coral}`}><PlusIcon /></div><div><b>{processing ? "Processing image…" : "Interactive elements"}</b><span>Add one or several cutouts</span></div><ChevronRightIcon />
          </div>

          <div className={styles.divider} />
          <div className={styles.fieldsTitle}><span>{selectedStoryElement ? `${selectedStoryElement.name} story` : "Scene annotation"}</span>{!selectedStoryElement && <button onClick={() => setShowMap(!showMap)} className={showMap ? styles.iconButtonActive : styles.iconButton}><MapPinIcon /></button>}</div>
          <label className={styles.field}><span>Title</span><input value={storyMetadata.title} onFocus={beginTextEdit} onBlur={finishTextEdit} onChange={(event) => updateStoryMetadata("title", event.target.value)} /></label>
          <label className={styles.field}><span>Subtitle</span><input value={storyMetadata.subtitle} onFocus={beginTextEdit} onBlur={finishTextEdit} onChange={(event) => updateStoryMetadata("subtitle", event.target.value)} /></label>
          <div className={styles.twoFields}>
            <label className={styles.field}><span>Location</span><input value={storyMetadata.location} onFocus={beginTextEdit} onBlur={finishTextEdit} onChange={(event) => updateStoryMetadata("location", event.target.value)} /></label>
            <label className={styles.field}><span>Time</span><input value={storyMetadata.time} onFocus={beginTextEdit} onBlur={finishTextEdit} onChange={(event) => updateStoryMetadata("time", event.target.value)} /></label>
          </div>
          <label className={styles.field}><span>Story text</span><textarea value={storyMetadata.text} onFocus={beginTextEdit} onBlur={finishTextEdit} onChange={(event) => updateStoryMetadata("text", event.target.value)} /></label>
          {showMap && !selectedStoryElement && <WorldPicker scene={scene} onChange={updateScene} />}
        </aside>

        <section className={styles.stageArea}>
          <div className={styles.stageToolbar}>
            <div><span className={styles.statusDot} /> Canvas <small>{STAGE_WIDTH} × {STAGE_HEIGHT}</small></div>
            <div className={styles.stageHint}>Drag to position · use the corner to resize</div>
            <button className={styles.iconButton} title="Reset selection" onClick={() => setSelectedId(null)}><ArrowPathIcon /></button>
          </div>
          <div className={styles.canvasShell}>
            <div
              className={styles.stage}
              ref={stageRef}
              onPointerMove={pointerMove}
              onPointerUp={finishPointer}
              onPointerCancel={finishPointer}
              onPointerDown={() => setSelectedId(null)}
            >
              {!scene.background && scene.elements.length === 0 && <div className={styles.emptyStage}><PhotoIcon /><b>Add an image to begin</b><span>Use the scene setup panel to add a background or element</span></div>}
              {backgroundElement && <div
                className={`${styles.element} ${styles.backgroundElement} ${selectedId === BACKGROUND_ID ? styles.selectedElement : ""} ${!backgroundElement.visible ? styles.hiddenElement : ""}`}
                style={{ left: `${backgroundElement.x / STAGE_WIDTH * 100}%`, top: `${backgroundElement.y / STAGE_HEIGHT * 100}%`, width: `${backgroundElement.width / STAGE_WIDTH * 100}%`, height: `${backgroundElement.height / STAGE_HEIGHT * 100}%`, transform: `rotate(${backgroundElement.rotation}deg)`, opacity: backgroundElement.opacity, zIndex: 0 }}
                onPointerDown={(event) => pointerDown(event, backgroundElement, "move")}
              >
                <img src={backgroundElement.src} alt="Background" draggable={false} />
                {backgroundElement.outline && backgroundElement.edgePath && <svg className={styles.imageOutline} viewBox={`0 0 ${backgroundElement.sourceWidth ?? backgroundElement.width} ${backgroundElement.sourceHeight ?? backgroundElement.height}`} preserveAspectRatio="none"><path d={backgroundElement.edgePath} /></svg>}
                {selectedId === BACKGROUND_ID && <><span className={styles.elementLabel}>Background</span><button className={styles.resizeHandle} aria-label="Resize background" onPointerDown={(event) => pointerDown(event, backgroundElement, "resize")} /></>}
              </div>}
              {scene.elements.map((element, index) => (
                <div
                  key={element.id}
                  className={`${styles.element} ${selectedId === element.id ? styles.selectedElement : ""} ${!element.visible ? styles.hiddenElement : ""}`}
                  style={{ left: `${element.x / STAGE_WIDTH * 100}%`, top: `${element.y / STAGE_HEIGHT * 100}%`, width: `${element.width / STAGE_WIDTH * 100}%`, height: `${element.height / STAGE_HEIGHT * 100}%`, transform: `rotate(${element.rotation}deg)`, opacity: element.opacity, zIndex: index + 1 }}
                  onPointerDown={(event) => pointerDown(event, element, "move")}
                >
                  <img src={element.src} alt={element.name} draggable={false} />
                  {element.outline && element.edgePath && <svg className={styles.imageOutline} viewBox={`0 0 ${element.sourceWidth ?? element.width} ${element.sourceHeight ?? element.height}`} preserveAspectRatio="none"><path d={element.edgePath} /></svg>}
                  {selectedId === element.id && <><span className={styles.elementLabel}>{element.name}</span><button className={styles.resizeHandle} aria-label="Resize element" onPointerDown={(event) => pointerDown(event, element, "resize")} /></>}
                </div>
              ))}
            </div>
          </div>
        </section>

        <aside className={styles.jsonPanel}>
          <div className={styles.jsonHeader}><div><CodeBracketIcon /><b>Story data</b></div><span className={jsonError ? styles.invalid : styles.valid}>{jsonError ? "Needs attention" : "Valid JSON"}</span></div>
          <div className={styles.jsonIntro}>Edit scene and element annotations using the SVG group IDs. Image data remains embedded in each exported SVG.</div>
          <textarea className={styles.codeEditor} spellCheck={false} value={jsonText} onChange={(event) => setJsonText(event.target.value)} />
          {jsonError && <div className={styles.errorMessage}>{jsonError}</div>}
          <div className={styles.jsonActions}>
            <button className={styles.ghostButton} onClick={() => setJsonText(JSON.stringify(scenesToStoryData(scenes), null, 2))}>Reset</button>
            <button className={styles.primaryButton} onClick={applyJson}>Apply JSON</button>
          </div>
          <button className={styles.downloadJson} onClick={() => download("story-data.json", jsonText, "application/json")}><ArrowDownTrayIcon /> Download story-data.json</button>
        </aside>

        <section className={styles.bottomPanel}>
          <div className={styles.layersPanel}>
            <div className={styles.bottomHeading}><div><Squares2X2Icon /><b>Layers</b><span>{scene.elements.length + (scene.background ? 1 : 0)}</span></div></div>
            <div className={styles.layerList}>
              {[...scene.elements].reverse().map((element) => {
                const realIndex = scene.elements.findIndex((item) => item.id === element.id);
                return <button key={element.id} className={`${styles.layerRow} ${selectedId === element.id ? styles.activeLayer : ""}`} onClick={() => setSelectedId(element.id)}>
                  <span className={styles.grip}>⋮⋮</span><span className={styles.thumb}>{element.src && <img src={element.src} alt="" />}</span><span className={styles.layerName}><b>{element.name}</b><span>#{element.id}_x5F_group</span></span>
                  <span className={styles.layerControls}>
                    <i onClick={(event) => { event.stopPropagation(); updateScene({ ...scene, elements: scene.elements.map((item) => item.id === element.id ? { ...item, visible: !item.visible } : item) }); }}>{element.visible ? <EyeIcon /> : <EyeSlashIcon />}</i>
                    <i className={realIndex === scene.elements.length - 1 ? styles.disabled : ""} onClick={(event) => { event.stopPropagation(); moveLayer(element.id, 1); }}><ChevronUpIcon /></i>
                    <i className={realIndex === 0 ? styles.disabled : ""} onClick={(event) => { event.stopPropagation(); moveLayer(element.id, -1); }}><ChevronDownIcon /></i>
                  </span>
                </button>;
              })}
              {backgroundElement && <button className={`${styles.layerRow} ${selectedId === BACKGROUND_ID ? styles.activeLayer : ""}`} onClick={() => setSelectedId(BACKGROUND_ID)}>
                <span className={styles.grip}>⋮⋮</span><span className={styles.thumb}>{backgroundElement.src ? <img src={backgroundElement.src} alt="" /> : <PhotoIcon />}</span><span className={styles.layerName}><b>Background</b><span>#background · inactive</span></span>
                <span className={styles.layerControls}><i onClick={(event) => { event.stopPropagation(); updateScene({ ...scene, backgroundVisible: !backgroundElement.visible }); }}>{backgroundElement.visible ? <EyeIcon /> : <EyeSlashIcon />}</i></span>
              </button>}
            </div>
          </div>

          <div className={styles.elementPanel}>
            {selected ? <>
              <div className={styles.bottomHeading}><div><b>{selectedIsBackground ? "Background settings" : "Element settings"}</b><span className={styles.selectedPill}>Selected</span></div><button className={styles.deleteButton} onClick={deleteSelected}><TrashIcon /> {selectedIsBackground ? "Remove background" : "Delete element"}</button></div>
              <div className={styles.elementSettings}>
                <label className={styles.field}><span>Name</span><input value={selected.name} disabled={selectedIsBackground} onFocus={beginTextEdit} onBlur={finishTextEdit} onChange={(event) => updateSelected({ name: event.target.value })} /></label>
                <label className={styles.field}><span>Element ID</span><input value={selected.id} disabled={selectedIsBackground} onFocus={beginTextEdit} onBlur={finishTextEdit} onChange={(event) => { const id = uniqueId(event.target.value, scene.elements.filter((item) => item.id !== selected.id).map((item) => item.id)); updateSelected({ id }); setSelectedId(id); }} /></label>
                <label className={styles.field}><span>Rotation <b>{selected.rotation}°</b></span><input type="range" min="-180" max="180" value={selected.rotation} onChange={(event) => updateSelected({ rotation: Number(event.target.value) })} /></label>
                <label className={styles.field}><span>Opacity <b>{Math.round(selected.opacity * 100)}%</b></span><input type="range" min="0" max="1" step="0.05" value={selected.opacity} onChange={(event) => updateSelected({ opacity: Number(event.target.value) })} /></label>
                <div className={`${styles.imageProcessing} ${styles.wideField}`}>
                  <label className={styles.toggleRow}><span><SparklesIcon /> Remove white background</span><input type="checkbox" checked={Boolean(selected.removeBackground)} disabled={processing} onChange={(event) => setElementRemoval(event.target.checked)} /><i /></label>
                  <button className={`${styles.outlineButton} ${selected.outline ? styles.outlineButtonActive : ""}`} disabled={processing} onClick={() => setElementOutline(!selected.outline)}><ArrowPathIcon /> {selected.outline ? "Remove shaped outline" : "Add shaped outline"}</button>
                </div>
                <label className={`${styles.field} ${styles.wideField}`}><span>Classes <b>{selectedIsBackground ? "fixed" : "space separated"}</b></span><input value={selected.classes.join(" ")} disabled={selectedIsBackground} onFocus={beginTextEdit} onBlur={finishTextEdit} onChange={(event) => updateSelected({ classes: event.target.value.split(/\s+/).filter((className) => className && className !== "interactive") })} placeholder="hidden inactive" /></label>
              </div>
            </> : <div className={styles.noSelection}><SparklesIcon /><div><b>Select an image</b><span>Edit its layer settings here. Scene text remains available on the left.</span></div></div>}
          </div>
        </section>
      </section>

      <footer className={styles.timeline}>
        <div className={styles.timelineLabel}><b>Story timeline</b></div>
        <button className={styles.timelineArrow} disabled={sceneIndex === 0} onClick={() => moveScene(-1)}><ChevronLeftIcon /></button>
        <div className={styles.sceneCards}>
          {scenes.map((item, index) => <button key={item.id} className={`${styles.sceneCard} ${index === sceneIndex ? styles.activeScene : ""}`} onClick={() => { setSceneIndex(index); setSelectedId(null); }}>
            <span className={styles.sceneNumber}>{String(index + 1).padStart(2, "0")}</span><span className={styles.scenePreview}>{item.background ? <img src={item.background} alt="" /> : <PhotoIcon />}</span><span><b>{item.title}</b><span>{item.time || "No date"} · {item.elements.length} element{item.elements.length === 1 ? "" : "s"}</span></span>
          </button>)}
          <button className={styles.addScene} onClick={addScene}><PlusIcon /> Add scene</button>
        </div>
        <button className={styles.timelineArrow} disabled={sceneIndex === scenes.length - 1} onClick={() => moveScene(1)}><ChevronRightIcon /></button>
      </footer>

      <input ref={backgroundInput} hidden type="file" accept="image/*,.svg" onChange={uploadBackground} />
      <input ref={elementInput} hidden type="file" accept="image/*,.svg" multiple onChange={uploadElements} />
      <input ref={importInput} hidden type="file" accept="application/json,.json" onChange={importJson} />
    </main>
  );
}
