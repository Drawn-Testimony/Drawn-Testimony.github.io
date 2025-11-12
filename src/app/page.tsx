"use client";
import dynamic from "next/dynamic";
import { Provider, useDispatch, useSelector } from "react-redux";
import { State, store } from "../../store/store";
import { setMode } from "../../store/appSlice";
import Image from "next/image";
import title from "../../public/images/SteenTitle_lines.png";
import { CursorArrowRaysIcon } from "@heroicons/react/24/solid";
import Painting from "./2d-painting/painting";
import { useMemo, useState } from "react";
import Link from "next/link";

// const Model = dynamic(() => import("@/components/model-viewer/Model"), {
//   loading: () => <p>Loading...</p>,
//   ssr: false,
// });

const paintings = [
  <Painting key={"transport"} svgFile={"/images/Transport scene-1.svg"} />,
  <Painting key={"soccer"} svgFile={"/images/Soccer scene-1 orig.svg"} />,
  // <Painting key={"soccer v2"} svgFile={"/images/Soccer scene-2 orig.svg"} />,
];

function MainMenu() {
  const mode = useSelector((state: State) => state.app.mode);
  const dispatch = useDispatch();

  const [selectedPainting, setSelectedPainting] = useState(0);

  const painting = useMemo(() => {
    return paintings.filter((e, i) => i === selectedPainting)[0];
  }, [selectedPainting]);

  return (
    <>
      {/* <Model
        glbSrc={`/assets/Barrack41_optimized_unlitMaterials.glb`}
        layout="split"
        annotations={[]}
      /> */}
      <div className="absolute top-0 left-0 h-16 w-full z-50 flex px-2">
        <Link
          className="relative w-25"
          href={"/"}
          onClick={() => {
            dispatch(setMode("default"));
          }}
        >
          <Image
            src="/assets/cropped-logoOctober-1.png"
            fill={true}
            style={{ objectFit: "contain" }}
            sizes={"40px 40px"}
            alt="Memorise Logo"
          />
        </Link>
      </div>
      {painting}
      <div
        className="absolute bottom-3 right-3 rounded-md bg-gray-100 px-2 shadow hover:shadow-lg hover:bg-gray-500 hover:text-white cursor-pointer"
        onClick={() => {
          setSelectedPainting((selectedPainting + 1) % paintings.length);
        }}
      >
        Next
      </div>
      <div
        className="absolute bottom-3 left-3 rounded-md bg-gray-100 px-2 shadow hover:shadow-lg hover:bg-gray-500 hover:text-white cursor-pointer"
        onClick={() => {
          setSelectedPainting((selectedPainting - 1) % paintings.length);
        }}
      >
        Previous
      </div>
      {mode === "default" && (
        <div
          className="grid grid-cols-[80%_20%] grid-rows-1 overflow-hidden absolute size-full painting-main"
          onClick={() => {
            dispatch(setMode("explore"));
          }}
        >
          <div className="relative size-full items-center flex justify-center">
            <Image
              alt="Title Splash Screen"
              // Importing an image will
              // automatically set the width and height
              src={title}
              sizes="100vw"
              // Make the image display full width
              // and preserve its aspect ratio
              style={{
                width: "auto",
                height: "70%",
              }}
            />
            <div className="absolute top-1/2 left-1/2 text-black">
              <CursorArrowRaysIcon
                width={50}
                height={50}
                className="animate-myping"
              />
            </div>
          </div>
          <div className="relative size-full text-gray-950">
            <div className="size-full absolute overflow-hidden overflow-y-scroll flex items-center">
              <div className="flex gap-4 flex-col p-3 px-6 justify-center text-justify">
                <div className="text-xl font-bold">
                  A Danish Boy In Theresienstadt:
                </div>
                <div className="text-xl mt-[-10px] italic font-bold">
                  A Drawn Testimony
                </div>
                {/* <div className="italic text-sm text-gray-600">
                  Artistic rendering of Camp Bergen-Belsen documenting the
                  liberation period. The artist Erwin Abadi was an Hungarian
                  victim of the Holocaust interned in the concentration camp
                  Bergen-Belsen. He remained hospitalized in Belsen after
                  liberation where he created dozens of works of art.
                </div> */}
                <div className="text-sm flex gap-2 flex-col">
                  <p>
                    On October 2, 1943, eight-year-old Steen Metz and his
                    parents were arrested in their home in Odense, Denmark, and
                    deported to Theresienstadt Concentration Camp. What followed
                    were eighteen months of hunger, brutality, and
                    loss—including the death of his father from starvation. Of
                    the 15,000 children who passed through Theresienstadt, fewer
                    than 1,500 survived. Steen was one of them.
                  </p>
                  <p>
                    For decades, like many Holocaust survivors, Steen kept his
                    experiences private. But in 2011, he was ready to share his
                    story through his memoir, "A Danish Boy in Theresienstadt."
                  </p>
                  <p>
                    Now, we retell Steen's journey through an interactive visual
                    experience, where hand-drawn illustrations guide you through
                    his memories. This isn't just a story to read—it's a story
                    to witness, to explore, and to remember.
                  </p>
                </div>
                <div className="grid grid-cols-[auto_auto] items-center justify-center gap-2">
                  <CursorArrowRaysIcon
                    width={30}
                    height={30}
                    className="animate-myping"
                  />
                  <div>Click into it to begin Steen's stroy!</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function Home() {
  return (
    <Provider store={store}>
      <MainMenu />
    </Provider>
  );
}
