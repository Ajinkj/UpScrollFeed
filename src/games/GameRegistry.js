import NBackGame from './NBackGame';
import StroopGame from './StroopGame';
import FiveWhyGame from './FiveWhyGame';
import CorsiBlockGame from './CorsiBlockGame';
import GoNoGoGame from './GoNoGoGame';
import ProcessingSpeedGame from './ProcessingSpeedGame';
import RSVPSpeedReaderGame from './RSVPSpeedReaderGame';
import SchulteTableGame from './SchulteTableGame';
import TaskSwitchingGame from './TaskSwitchingGame';

export const GAME_REGISTRY = [
  { id: 'nback', name: 'N-Back Memory', component: NBackGame },
  { id: 'stroop', name: 'Stroop Test', component: StroopGame },
  { id: '5why', name: '5 Whys Detective', component: FiveWhyGame },
  { id: 'corsi', name: 'Corsi Block', component: CorsiBlockGame },
  { id: 'gonogo', name: 'Go/No-Go', component: GoNoGoGame },
  { id: 'processing', name: 'Processing Speed', component: ProcessingSpeedGame },
  { id: 'rsvp', name: 'RSVP Reader', component: RSVPSpeedReaderGame },
  { id: 'schulte', name: 'Schulte Table', component: SchulteTableGame },
  { id: 'taskswitch', name: 'Task Switching', component: TaskSwitchingGame },
];
