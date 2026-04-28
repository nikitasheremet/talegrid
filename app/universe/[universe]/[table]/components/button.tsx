"use client";

export default function Button({
  click,
  buttonText,
}: {
  click: Function;
  buttonText: string;
}) {
  return (
    <button className="hover:cursor-pointer" onClick={() => click()}>
      {buttonText}
    </button>
  );
}
