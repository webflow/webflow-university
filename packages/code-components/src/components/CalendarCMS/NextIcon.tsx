import type { IconProps } from "./types";

const NextIcon = ({
  width = 16,
  height = 16,
  stroke = "currentColor",
  className,
}: IconProps) => {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      pointerEvents="none"
    >
      <path
        d="M6 12L10 8L6 4"
        stroke={stroke}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
};

export default NextIcon;
