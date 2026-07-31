import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/**
 * Reusable delete confirmation dialog.
 *
 * @param {object}   props
 * @param {boolean}  props.open        - Whether the dialog is visible.
 * @param {Function} props.onClose     - Called when the user dismisses without confirming.
 * @param {Function} props.onConfirm   - Called when the user confirms deletion.
 * @param {string}   props.title       - Dialog title, e.g. "Delete Department".
 * @param {string}   props.description - Body text describing what will be deleted.
 * @param {boolean}  [props.loading]   - Optional: shows deleting state on the confirm button.
 */
export function DeleteConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = "Confirm Delete",
  description = "This action cannot be undone.",
  loading = false,
}) {
  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent showCloseButton={false} className="max-w-sm">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-rose-100 dark:bg-rose-500/10">
              <Trash2 className="w-5 h-5 text-rose-600 dark:text-rose-400" aria-hidden="true" />
            </div>
            <DialogTitle className="text-slate-800 dark:text-white text-base font-bold">
              {title}
            </DialogTitle>
          </div>
        </DialogHeader>

        <DialogDescription className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed px-0">
          {description}
        </DialogDescription>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
            className="rounded-xl border-slate-200 dark:border-slate-700 font-semibold"
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            disabled={loading}
            className="rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold border-0"
          >
            {loading ? "Deleting…" : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
