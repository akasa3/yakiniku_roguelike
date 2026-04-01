# Test: FR-08 Meat Catalog (図鑑)

> t_wada TDD-style spec — defines expected behavior BEFORE implementation (Red phase).
> Source references: GAME_DESIGN.md §12, §4, §4b; requirements.md FR-08.

---

## Catalog Unlock on First Eat

### Test: eating a meat part for the first time unlocks its catalog entry
- **Given**: the player has never eaten Kalbi (カルビ) in any previous run; catalog entry for Kalbi is locked
- **When**: the player eats a Kalbi piece in the `well-done` state (or any edible state)
- **Then**: the Kalbi entry in the catalog is unlocked immediately and becomes viewable (GDD §12: "Unlocked per part on first successful eat")

### Test: eating a meat part that is already unlocked does not create a duplicate entry
- **Given**: the catalog entry for Kalbi is already unlocked
- **When**: the player eats another piece of Kalbi in the same or a later run
- **Then**: the catalog still has exactly one Kalbi entry; no duplicate is added

### Test: discarding meat does NOT unlock its catalog entry
- **Given**: the catalog entry for Beef Tongue (牛タン) is locked
- **When**: the player discards a Beef Tongue piece (any state)
- **Then**: the Beef Tongue catalog entry remains locked

### Test: burning meat (state transitions to burnt without eating) does NOT unlock its catalog entry
- **Given**: the catalog entry for Harami (ハラミ) is locked
- **When**: a Harami piece reaches the `burnt` state and is discarded or causes a Grill Fire event
- **Then**: the Harami catalog entry remains locked

### Test: eating raw meat still unlocks the catalog entry despite triggering a penalty
- **Given**: the catalog entry for Upper Kalbi (上カルビ) is locked
- **When**: the player eats Upper Kalbi in the `raw` state (triggering the Raw Meat penalty, GDD §5.1)
- **Then**: the Upper Kalbi catalog entry IS unlocked; the eat action counts as a "first successful eat" even when a penalty fires

### Test: all 11 meat parts are individually unlockable in the catalog
- **Given**: a fresh run with no catalog entries unlocked
- **When**: the player successfully eats one piece of each of the 11 meat parts (Kalbi, Beef Tongue, Harami, Upper Kalbi, Thick Tongue, Loin, Special Kalbi, Zabuton, Misuji, Chateaubriand, Ichibo)
- **Then**: all 11 entries are unlocked; the catalog shows exactly 11 meat entries (GDD §4.2)

### Test: eating a vegetable does NOT add it to the meat catalog
- **Given**: the meat catalog contains only meat part entries
- **When**: the player eats Green Pepper (ピーマン) or Eggplant (なす) for the first time
- **Then**: no vegetable entry appears in the meat catalog (vegetables are a separate category or omitted; GDD §4b does not describe them as catalog entries)

---

## No Duplicate Entries

### Test: catalog entry count equals the number of distinct parts ever eaten, capped at 11
- **Given**: the player has eaten Kalbi five times across multiple runs
- **When**: the catalog is opened
- **Then**: exactly one Kalbi entry is present; total entry count does not exceed 11 meat parts

### Test: eating the same meat part in different grilling states still produces only one catalog entry
- **Given**: Beef Tongue catalog entry is already unlocked from eating it in `well-done` state
- **When**: the player eats Beef Tongue in `rare` state in a later run
- **Then**: the catalog still contains exactly one Beef Tongue entry; no second entry for the rare-state eat is added

### Test: eating the same meat part in different restaurant cycles does not duplicate the entry
- **Given**: Kalbi entry is unlocked in Cycle 1
- **When**: the player eats Kalbi again in Cycle 3
- **Then**: the catalog has one Kalbi entry; cycle repetition does not cause duplication

---

## Catalog Persistence Across Runs

### Test: unlocked catalog entries persist after a run ends (game over)
- **Given**: the player unlocks Chateaubriand (シャトーブリアン) during a run, then gets a game over
- **When**: the player starts a new run
- **Then**: the Chateaubriand catalog entry is still unlocked in the new run; the per-run state reset does NOT reset catalog unlocks (requirements FR-09: "Per-run state (score, skills, coins) resets" — catalog is not listed as per-run state)

### Test: catalog unlock state is saved to localStorage
- **Given**: the player unlocks Zabuton (ザブトン) during a run
- **When**: the browser is closed and reopened, and a new run is started
- **Then**: the Zabuton catalog entry is still unlocked; the unlock was persisted to localStorage

### Test: catalog persists across different characters
- **Given**: Misuji (ミスジ) was unlocked while playing as Salaryman Tanaka
- **When**: the player selects Gourmet Critic and opens the catalog
- **Then**: the Misuji entry is still present; catalog unlocks are global across characters, not per-character

### Test: clearing localStorage resets the catalog (expected behavior, not a bug)
- **Given**: the player has 8 catalog entries unlocked, stored in localStorage
- **When**: localStorage is cleared (e.g., via browser settings)
- **Then**: all catalog entries return to locked state on next page load; this is the defined persistence mechanism (requirements FR-09 implies localStorage-based persistence)

---

## Humorous Flavor Text Per Entry

### Test: each unlocked catalog entry displays exactly one flavor text string
- **Given**: a catalog entry has been unlocked (e.g., Kalbi)
- **When**: the player opens the catalog and views the Kalbi entry
- **Then**: a non-empty humorous flavor text string is displayed (GDD §12: "a humorous flavor text")

### Test: Chateaubriand entry displays its specified flavor text
- **Given**: the Chateaubriand (シャトーブリアン) catalog entry is unlocked
- **When**: the player views the Chateaubriand entry in the catalog
- **Then**: the flavor text reads: *"The pinnacle of solo BBQ. No one is watching, so you can take 10 minutes on this one."* (GDD §12 example)

### Test: locked catalog entries do not display flavor text
- **Given**: a catalog entry is in the locked state (meat part not yet eaten)
- **When**: the player views the catalog
- **Then**: the flavor text field is hidden or replaced with a placeholder (e.g., "???"); the actual flavor text is not revealed before unlock

### Test: all 11 meat parts have distinct, non-empty flavor text strings
- **Given**: all 11 meat catalog entries are unlocked
- **When**: the player views each entry
- **Then**: each entry has a non-empty flavor text string; no two entries share the same flavor text (each part has its own humorous description)

---

## Catalog Entry Display Fields

### Test: each catalog entry shows the meat part's Japanese name
- **Given**: the catalog entry for Kalbi is unlocked
- **When**: the player views the Kalbi entry
- **Then**: the Japanese name "カルビ" is displayed (GDD §12: "name (JP/EN)")

### Test: each catalog entry shows the meat part's English name
- **Given**: the catalog entry for Kalbi is unlocked
- **When**: the player views the Kalbi entry
- **Then**: the English name "Kalbi" is displayed (GDD §12: "name (JP/EN)")

### Test: each catalog entry shows the meat part's rank
- **Given**: catalog entries for Kalbi (Common) and Chateaubriand (Elite) are both unlocked
- **When**: the player views each entry
- **Then**: Kalbi displays rank "Common (並)" and Chateaubriand displays rank "Elite (極)" (GDD §12: "rank"; §4.1 rank definitions)

### Test: each catalog entry shows grill tips
- **Given**: a catalog entry is unlocked
- **When**: the player views the entry
- **Then**: a non-empty grill tips field is displayed, consistent with the meat's `grill_time`, `flare_risk`, and `sweet_spot` parameters (GDD §12: "grill tips")

### Test: grill tips for high flare_risk meats mention flare risk
- **Given**: catalog entry for Special Kalbi (特上カルビ, flare_risk = Very High 60%) is unlocked
- **When**: the player views the grill tips
- **Then**: the grill tips field communicates the high flare risk in some form (e.g., warning about quick burning)

### Test: locked entries show a placeholder or obscured display, not an error
- **Given**: the player has never eaten Ichibo (イチボ)
- **When**: the Ichibo slot is visible in the catalog
- **Then**: the entry is displayed in a locked/obscured state (silhouette, "???" text, or similar); the page does not crash or show a missing data error

---

## Catalog Completeness Validation

### Test: catalog tracks all 11 meat parts defined in GDD §4.2, no more and no fewer
- **Given**: the catalog system is initialized
- **When**: the catalog data is inspected
- **Then**: exactly 11 meat part entries exist, matching: Kalbi, Beef Tongue, Harami, Upper Kalbi, Thick Tongue, Loin, Special Kalbi, Zabuton, Misuji, Chateaubriand, Ichibo

### Test: catalog does not contain entries for meat parts not in GDD §4.2
- **Given**: the full catalog is displayed (all entries unlocked)
- **When**: the player counts the entries
- **Then**: there are exactly 11 entries; no extra or placeholder entries beyond the defined 11 parts appear
