import React from "react";
import satori from "satori";
import sharp from "sharp";
import slugify from "slugify";
const generate = async ({
  title
}) => {
  const svg = await svgFromJsx(title);
  const path = `./${slugify(title)}.png`;
  await saveToFile(svg, path);
};
const svgFromJsx = async title => {
  const fontFile = await fetch("https://og-playground.vercel.app/inter-latin-ext-700-normal.woff");
  const fontArrayBuffer = await fontFile.arrayBuffer();
  const svg = await satori(
  /*#__PURE__*/
  // JSX with Tailwind CSS (class->tw)
  React.createElement("div", {
    tw: "flex h-[300px] w-[600px] items-center justify-center bg-white text-4xl text-blue-600"
  }, title), {
    width: 600,
    height: 300,
    fonts: [{
      name: "Inter",
      data: fontArrayBuffer,
      weight: 700,
      style: "normal"
    }]
  });
  return svg;
};
const saveToFile = async (svg, path) => {
  await sharp(Buffer.from(svg)).png().toFile(path, error => {
    console.error(error);
  });
};
generate({
  title: "og image with satori"
});
