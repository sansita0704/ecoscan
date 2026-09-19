/**
 * Rolling vote with hysteresis over a stream of per-tick classifications.
 *
 * A stateless per-frame classifier flickers between close classes on a live
 * feed, so treating each frame as ground truth swaps the UI every tick. Two
 * separate mechanisms keep the reading steady without making it sluggish:
 *
 *  - WHICH class shows is decided by a majority over the last `windowSize`
 *    *detections*. Ticks where the model found nothing are deliberately NOT
 *    counted here. A real webcam misses plenty of frames, and letting those
 *    misses dilute the window means a genuine item can sit just under the bar
 *    forever - the item never appears, or an impostor that happens to cluster
 *    wins instead.
 *
 *  - WHETHER anything shows at all is decided by `maxMisses` consecutive empty
 *    ticks, which is the honest signal that the item has left the frame.
 *
 * Thrash is prevented by requiring the leader to beat the runner-up outright
 * rather than by setting a high threshold. With an EVEN window, two classes
 * alternating every frame always tie (windowSize/2 each), so neither is ever
 * adopted and the display holds still. That property is why the window must be
 * even, and it lets `adoptVotes` stay low enough to react in a couple of frames.
 */
export function createClassVoter({ windowSize, adoptVotes, keepVotes, maxMisses }) {
  if (windowSize % 2 !== 0) {
    throw new Error(`windowSize ${windowSize} must be even, or alternating classes thrash`);
  }
  if (adoptVotes < 2 || adoptVotes > windowSize) {
    throw new Error(`adoptVotes ${adoptVotes} must be between 2 and windowSize ${windowSize}`);
  }
  if (keepVotes < 1 || keepVotes > adoptVotes) {
    throw new Error(`keepVotes ${keepVotes} must be between 1 and adoptVotes ${adoptVotes}`);
  }

  let votes = [];
  let misses = 0;
  let shown = null;

  return {
    /**
     * @param {string|null} className this tick's pick, or null for no detection.
     * @returns {string|null} the class that should be displayed.
     */
    push(className) {
      if (className) {
        misses = 0;
        votes.push(className);
        if (votes.length > windowSize) votes.shift();
      } else {
        misses += 1;
        if (misses >= maxMisses) {
          votes = [];
          shown = null;
          return null;
        }
      }

      const counts = new Map();
      for (const name of votes) counts.set(name, (counts.get(name) ?? 0) + 1);

      let leader = null;
      let best = 0;
      let runnerUp = 0;
      for (const [name, count] of counts) {
        if (count > best) {
          runnerUp = best;
          best = count;
          leader = name;
        } else if (count > runnerUp) {
          runnerUp = count;
        }
      }

      if (leader && best >= adoptVotes && best > runnerUp) {
        shown = leader;
      } else if (!shown || (counts.get(shown) ?? 0) < keepVotes) {
        shown = null;
      }
      return shown;
    },
    reset() {
      votes = [];
      misses = 0;
      shown = null;
    },
  };
}
