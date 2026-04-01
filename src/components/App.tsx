import { useState } from 'react';
import { useGameEngine } from '../hooks/useGameEngine';
import { usePersistence } from '../hooks/usePersistence';
import { getShopOfferings } from '../game/systems/node';
import { SKILLS } from '../game/data/skills';
import { TitleScreen } from './TitleScreen';
import { PlayingScreen } from './PlayingScreen';
import { SkillSelectScreen } from './SkillSelectScreen';
import { NodeSelectScreen } from './NodeSelectScreen';
import { ShopScreen } from './ShopScreen';
import { GameOverScreen } from './GameOverScreen';
import { TrueEndingScreen } from './TrueEndingScreen';
import type { SkillDefinition } from '../types/index';

export default function App() {
  const engine = useGameEngine();
  const { persistent, reload } = usePersistence();
  const [showShop, setShowShop] = useState(false);

  const { state } = engine;

  if (state === null) {
    return (
      <TitleScreen
        onStartGame={(characterId) => {
          reload();
          engine.startGame(characterId);
        }}
        persistent={persistent}
      />
    );
  }

  const handleReturnToTitle = () => {
    setShowShop(false);
    reload();
    engine.returnToTitle();
  };

  switch (state.phase) {
    case 'playing':
      return (
        <PlayingScreen
          state={state}
          onEat={engine.eatMeat}
          onDiscard={engine.discardMeat}
          onFlip={engine.flipMeat}
          onExchange={engine.instantExchange}
          onDelayedExchange={engine.delayedExchange}
          onOpenShop={() => setShowShop(true)}
        />
      );

    case 'skill-select':
      return (
        <SkillSelectScreen
          pendingSkillChoices={state.pendingSkillChoices}
          onSelectSkill={engine.selectSkill}
          score={state.score}
          coins={state.coins}
          restaurantName={state.restaurant.definition.nameJP}
          restaurantType={state.restaurant.definition.type}
        />
      );

    case 'node-select': {
      if (showShop) {
        const offerings = getShopOfferings(state);
        return (
          <ShopScreen
            coins={state.coins}
            skills={offerings.skills}
            consumables={offerings.consumables}
            onPurchaseSkill={engine.purchaseSkill}
            onPurchaseConsumable={engine.purchaseConsumable}
            onLeaveShop={() => {
              setShowShop(false);
              engine.leaveShop();
            }}
          />
        );
      }
      return (
        <NodeSelectScreen
          onSelectRest={engine.selectRest}
          onSelectShop={() => {
            setShowShop(true);
            engine.selectShop();
          }}
        />
      );
    }

    case 'game-over': {
      // Build skill definitions list from acquired skill ids
      const acquiredSkills: SkillDefinition[] = state.skills
        .map((id) => SKILLS.find((s) => s.id === id))
        .filter((s): s is SkillDefinition => s !== undefined);

      return (
        <GameOverScreen
          reason={state.gameOver ?? 'table-overflow'}
          score={state.score}
          character={state.character}
          skills={acquiredSkills}
          onReturnToTitle={handleReturnToTitle}
        />
      );
    }

    case 'true-ending':
      return (
        <TrueEndingScreen
          score={state.score}
          character={state.character}
          onReturnToTitle={handleReturnToTitle}
        />
      );

    default:
      return <div style={{ fontFamily: 'monospace', padding: '2rem' }}>不明なフェーズ (Unknown phase)</div>;
  }
}
