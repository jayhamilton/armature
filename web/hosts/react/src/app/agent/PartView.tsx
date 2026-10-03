import { partCardKey, partCards, type PartCardProps } from './partCardRegistry';

/** Renders a part with its registered card; a part with no card shows nothing, as in Angular. */
export function PartView(props: PartCardProps) {
  const card = partCards.resolve(partCardKey(props.part));
  if (!card.found) return null;
  const Card = card.value;
  return <Card {...props} />;
}
