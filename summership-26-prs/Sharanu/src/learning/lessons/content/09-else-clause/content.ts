import type { Lesson } from "../../types";

const elseClause: Lesson = {
  id: "ElseClause",
  slug: "09-else-clause",
  order: 9,
  title: "The else Clause",

  storyTitle: "The Bow That Broke Clean",
  storyBody: `King Janaka is holding a contest to find a husband for his daughter Sita. Whoever can lift and string Shiva's great bow, Pinaka, wins her hand. The bow is so heavy that it takes hundreds of men just to roll it into the hall.

One king after another steps up and tries. Most cannot even shift it off the ground. There is nothing confusing about their failure. The bow simply does not move for them, and they step back with nothing more to say.

Then a young prince named Rama is brought forward by the sage Vishwamitra. Almost no one outside his home city has heard of him. He walks up to the bow without hesitation, lifts it in one smooth motion, and as he draws it back to string it, the bow snaps clean in two.

There is no struggle to recover from. No near miss that gets explained away. Just one clean success, with nothing left to fix.`,
  storyIntroLine: `Let me tell you about a trial that ended in one clean stroke, with nothing to recover from.`,
  storyDialogue: [
    { speaker: "Vishwamitra", line: "Rama, step forward. The bow of Shiva is waiting." },
    { speaker: "Rama", line: "I will try, Guruji." },
    { speaker: "Vishwamitra", line: "Lift it the way it is meant to be lifted." },
    { speaker: "Rama", line: "It is done. The bow broke as I drew it back." },
    { speaker: "Vishwamitra", line: "Then the trial is won, cleanly, with no doubt at all." },
  ],
  storyOutroQuestion: `Every king before Rama needed people to understand why he had failed. Rama needed something different, a moment that could just be stated as a win. What do you think changes when a success does not need any explaining?`,

  pauseQuestion: "If a try block runs with no problems at all, is there a way to write code that runs only in that clean-success case, separate from code that runs no matter what?",
  pauseChoices: [
    "No, you would just put that code right after the try/except block",
    "Yes, Python has an else clause that runs only if no exception occurred",
    "Yes, but only inside the except block itself",
    "No, try blocks do not distinguish success from failure once they finish",
  ],
  pauseCorrectChoice: 1,

  conceptExplainer: `Python's try statement can include an else clause. It is code that only runs if the try block finished with no exception at all. That is different from code you place after the whole try/except, because that code runs whether or not an exception was caught and handled, which quietly blurs together it worked and it failed but we recovered. else only runs on the clean path.

  try:
      bow = lift_bow('Pinaka')
  except BowTooHeavyError:
      print('The bow would not move')
  else:
      print(f'{bow} lifted cleanly, the trial is won')

If lifting the bow fails, the except runs and else is skipped entirely. If it succeeds, else runs and the except never does.`,

  mappingExplainer: `Every king before Rama needed the except path, a plain, honest admission that the bow did not move. There is no shame in saying that. Rama needed something else, a moment recorded as a real, uncomplicated success, not an error that simply failed to happen, but an accomplishment worth stating in its own right.

That is exactly what an else clause is for. It is tempting to think you do not need it, that writing your success code right after the try/except would work almost the same. But there is a real difference. Code placed after the whole block runs even when an exception was caught and handled, mixing the clean win together with the recovery. else keeps the clean win separate from the recovery, the same way the story keeps Rama's single stroke separate from every king before him who needed a different kind of ending.`,

  codeExamples: [
    {
      label: "Without else, success and recovery blur together",
      language: "python",
      code: `try:
    bow = lift_bow('Pinaka')
except BowTooHeavyError:
    bow = None
    print('The bow would not move')

if bow:
    print(f'{bow} lifted cleanly')
# This works, but now the clean-success check lives in a
# separate if instead of living in the try itself.`,
    },
    {
      label: "With else, the clean path is explicit",
      language: "python",
      code: `try:
    bow = lift_bow('Pinaka')
except BowTooHeavyError:
    print('The bow would not move')
else:
    print(f'{bow} lifted cleanly, the trial is won')
# else only runs if lift_bow() raised nothing at all.`,
    },
  ],

  practiceLadder: [
    {
      stage: "predict",
      prompt: "If lift_bow() raises BowTooHeavyError in this version, will the message Trial complete get printed? Walk through exactly which branch runs.",
      starterCode: `try:
    bow = lift_bow('Pinaka')
except BowTooHeavyError:
    print('Failed')
else:
    print('Trial complete')`,
    },
    {
      stage: "debug",
      prompt: "This code should only print a success message when the file actually loads, but right now it prints even after a failure is caught. Fix it using else.",
      starterCode: `try:
    with open('trial_results.txt') as f:
        data = f.read()
except FileNotFoundError:
    data = None
    print('No results file yet')
print('Results loaded successfully')`,
      solutionCode: `try:
    with open('trial_results.txt') as f:
        data = f.read()
except FileNotFoundError:
    data = None
    print('No results file yet')
else:
    print('Results loaded successfully')`,
    },
    {
      stage: "apply",
      prompt: "A payment app tries to charge a card, catches a CardDeclinedError, and needs to send a confirmation email only when the charge actually succeeds. Where should the email-sending code go: in the try, the except, or an else, and why does it matter?",
    },
  ],

  reflectionPrompt:
    "Rama's success did not need explaining or recovering from, it just needed to be stated plainly. Where else does keeping a clean success separate from a recovered failure actually change how a story, or a piece of code, reads?",

  badgeUnlocked: "Pinaka, The Bow That Needed No Recovery",
};

export default elseClause;