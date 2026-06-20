import Card from "./Card";
import type { CardMap } from "./gameEngine";
import type { DragState } from "./useCardDrag";
import styles from "./DragPreview.module.css";

interface DragPreviewProps {
  drag: DragState;
  cards: CardMap;
}

const noop = () => {};

// A floating, non-interactive clone of the card(s) being dragged. It tracks the
// pointer and is hidden from assistive tech (drag is a pointer-only enhancement;
// the live announcements still come from the move itself).
export default function DragPreview({ drag, cards }: DragPreviewProps) {
  return (
    <div
      className={styles.preview}
      aria-hidden="true"
      style={{
        left: `${drag.x - drag.offsetX}px`,
        top: `${drag.y - drag.offsetY}px`,
      }}
    >
      {drag.keys.map((key, i) => {
        const card = cards[key];
        if (!card) return null;
        return (
          <Card
            key={key}
            rank={card.rank}
            suit={card.suit}
            objKey={card.objKey}
            selectCardFn={noop}
            interactive={false}
            fanned={i > 0}
            dispIndex={i}
          />
        );
      })}
    </div>
  );
}
