/* MKT301 Arena course settings read by the shared engine (engine/*.js). Loaded first. */
const CRS={
  id:'mkt301',CODE:'MKT301',name:'MKT301 Arena',ls:'mkt301_',repo:'mkt301',
  title:'International Marketing',
  /* the weekly 6th-spot challenge (engine/wild.js): class starts Tuesday 4:00 pm (GMT+5); the challenge is open the 24 hours before */
  wild:{day:2,hour:16},
  /* topics the lecturer has already chosen for a week (used when no other topics are saved before it opens) */
  wildPlan:{'w2026-11-03':['10','11']},
  themeColor:{light:'#f7f2e8',dark:'#0b1026'},
  /* level index cut-offs for the three leaderboard tiers */
  tierCut:[1,3],
  noreply:'noreply@mkt301-f8830.firebaseapp.com',
  /* course-only counters and progress fields in a new student's record */
  blankN:{strat:0,errc:0,eplans:0,essays:0},
  blankX:{cw:{},ess:{},bweek:0},
  /* short-answer areas are keyed 'w'+week */
  bPfx:'w',
  logw:{plan:'answer plan',typed:'typed answer',timed:'timed answer',check:'self-check',ca:'strategy tool',catimed:'strategy part written',cacheck:'strategy self-check',ess:'Essay Coach tool',essay:'essay written',emark:'essay self-marked'},
  heatWord:'Green',
  recentWhat:'plans, typed and timed answers, strategy tools and essays',
  /* concept check (engine/concepts.js): case names to ignore, hand-tuned patterns (question id → chip index → alternatives)
     and how many key ideas make a complete answer where the question asks for fewer than the chips cover (e.g. "choose ONE country") */
  conceptStop:'iceto cbtl kandu bites',
  conceptSyn:{},
  conceptOver:{
    ic2a:{3:[['for','who'],['positioning statement'],['position','as the']]},
    tu2a:{4:[['for','who'],['positioning statement']]},
    cb2b:{0:[['for','who'],['positioning statement']]},
    ic3a:{5:[['recommend'],['best option'],['should','because']]},
    cb2a:{5:[['more attractive'],['recommend'],['better target'],['should focus']]},
    b09:{4:[['example'],['for example'],['for instance'],['such as'],['e','g']]},b53:{5:[['example'],['for example'],['for instance'],['such as'],['e','g']]}
  },
  conceptNeed:{ic1b:3,tu2a:4}
};
