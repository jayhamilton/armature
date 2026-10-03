import type { ReactNode } from 'react';
import { TypeRegistry, type ResolvedPart } from '@armature/core';
import type { IGadget } from '../gadgets/common/gadget-common/gadget-base/gadget.model';
import {
  A2uiCard,
  BoardListCard,
  GadgetMoveCard,
  GadgetRemoveCard,
  GadgetSuggestionCard,
  IframeCard,
  McpAppCard,
  RowAddCard,
  RowLayoutCard,
  TextPart,
} from './AgentPartCards';

/** A resolved ui part, with this host's gadget type. */
export type ChatPart = ResolvedPart<IGadget>;

export interface PartCardProps {
  part: ChatPart;
  onSwitchBoard: (boardId: number) => void;
  onA2uiAction: (part: ChatPart, action: string) => void;
}

type PartCard = (props: PartCardProps) => ReactNode;

/**
 * The card registry key for a part: its componentType for a component part,
 * otherwise its type (text, iframe, mcp-app).
 */
export function partCardKey(part: ChatPart): string {
  return part.type === 'component' ? (part.componentType ?? '') : part.type;
}

/**
 * How each kind of part is shown, looked up by {@link partCardKey} instead of
 * an if chain, matching the resolver registry in @armature/core: a new part
 * type is a resolver there and one card here.
 */
export const partCards = new TypeRegistry<PartCard>('agent part card')
  .register('text', TextPart)
  .register('board-list', BoardListCard)
  .register('gadget-move', GadgetMoveCard)
  .register('gadget-remove', GadgetRemoveCard)
  .register('row-add', RowAddCard)
  .register('row-layout', RowLayoutCard)
  .register('gadget-suggestion', GadgetSuggestionCard)
  .register('a2ui-card', A2uiCard)
  .register('iframe', IframeCard)
  .register('mcp-app', McpAppCard);
