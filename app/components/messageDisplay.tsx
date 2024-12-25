type Props = {
  content: string;
  variant?: "user" | "assistant";
};

export function MessageDisplay({ content, variant }: Props) {
  return (
    <div className="m-8 p-4">
      <div className="font-bold py-2">
        {variant === "user" ? "User" : "Assistant"}
      </div>
      {content}
    </div>
  );
}
