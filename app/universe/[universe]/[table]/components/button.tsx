"use client";

export default function Button({
  click,
  buttonText,
}: {
  click: Function;
  buttonText: string;
}) {
  return <button onClick={() => click()}>{buttonText}</button>;
}
