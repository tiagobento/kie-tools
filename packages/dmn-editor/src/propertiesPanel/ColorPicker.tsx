import * as React from "react";
import { useRef } from "react";

export function ColorPicker(props: {
  color: string;
  onChange: (newColor: string) => void;
  colorPickerRef?: React.MutableRefObject<HTMLInputElement>;
  icon?: React.ReactNode;
  colorDisplay?: React.ReactNode;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-evenly",
          alignItems: "center",
        }}
        onClick={() => props.colorPickerRef?.current?.click()}
      >
        {props.icon}
        {props.colorDisplay ? (
          props.colorDisplay
        ) : (
          <div style={{ height: "4px", width: "18px", backgroundColor: props.color }} />
        )}

        <input
          ref={(ref) => {
            if (ref !== null) {
              (inputRef as React.MutableRefObject<HTMLInputElement>).current = ref;
              if (props.colorPickerRef) {
                props.colorPickerRef.current = ref;
              }
            }
          }}
          aria-label={"Font color"}
          type={"color"}
          disabled={false}
          value={props.color}
          style={{ opacity: 0, width: 0, height: 0 }}
          onChange={(e) => props.onChange(e.currentTarget.value)}
        />
      </div>
    </>
  );
}
