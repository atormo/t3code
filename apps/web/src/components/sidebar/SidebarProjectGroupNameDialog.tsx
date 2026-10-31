import { useId, useRef, useState } from "react";

import { Button } from "../ui/button";
import {
  Dialog,
  DialogFooter,
  DialogHeader,
  DialogPanel,
  DialogPopup,
  DialogTitle,
} from "../ui/dialog";
import { Input } from "../ui/input";

export type SidebarProjectGroupNameRequest =
  | { readonly kind: "create"; readonly projectKey: string | null }
  | { readonly kind: "rename"; readonly groupId: string; readonly currentName: string };

export function SidebarProjectGroupNameDialog(props: {
  request: SidebarProjectGroupNameRequest;
  onSubmit: (name: string) => void;
  onCancel: () => void;
  /** What is being named, for a dialog reused outside folders. */
  noun?: string;
}) {
  const { request } = props;
  const noun = props.noun ?? "folder";
  const Noun = noun.charAt(0).toUpperCase() + noun.slice(1);
  const formId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(request.kind === "rename" ? request.currentName : "");
  const canSubmit = name.trim().length > 0;

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) props.onCancel();
      }}
    >
      <DialogPopup className="max-w-sm" initialFocus={inputRef}>
        <DialogHeader>
          <DialogTitle>{request.kind === "create" ? `New ${noun}` : `Rename ${noun}`}</DialogTitle>
        </DialogHeader>
        <DialogPanel scrollFade={false}>
          <form
            id={formId}
            onSubmit={(event) => {
              event.preventDefault();
              if (canSubmit) props.onSubmit(name);
            }}
          >
            <Input
              ref={inputRef}
              aria-label={`${Noun} name`}
              autoComplete="off"
              name="sidebar-project-group-name"
              placeholder={`${Noun} name`}
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </form>
        </DialogPanel>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={props.onCancel}>
            Cancel
          </Button>
          <Button disabled={!canSubmit} form={formId} type="submit">
            {request.kind === "create" ? "Create" : "Rename"}
          </Button>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  );
}
