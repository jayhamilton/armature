# Illustrations

SVG illustrations available to the **Illustration** gadget and to the
"Insert illustration" button in the Text gadget's markdown editor.

Sourced from [unDraw](https://undraw.co) — check unDraw's current license
terms before redistributing; as of this writing their illustrations are free
for personal and commercial use with no attribution required.

## Adding an illustration

1. Pick an SVG from https://undraw.co/illustrations.
2. Save it here, named `<id>.svg`, where `<id>` matches one of the ids listed
   in `src/app/shared/illustrations/illustration-options.ts` (or a new id you
   add there).
3. Register it in `illustration-options.ts` if it isn't already listed —
   `{ id, label }` is all that's needed; the file path is always derived as
   `assets/images/illustrations/<id>.svg`.

Ids are deliberately independent of unDraw's own internal file names, so a
given illustration slot (e.g. `empty-state`) can be swapped for a different
piece of matching artwork later without touching any gadget config that
already references it.
