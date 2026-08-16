import type { Lesson } from "../../types";

const fileNotFoundError: Lesson = {
  id: "FileNotFoundError",
  slug: "08-file-not-found-error",
  order: 8,
  title: "FileNotFoundException",

  storyTitle: "The Hermitage That Was Empty",
  storyBody: `King Dasharatha dies of grief soon after Rama's exile. Bharata is called back to rule, but he refuses the throne — it was never meant to be his. He wants to give it back to Rama himself.

So Bharata sets out from Ayodhya with an army and a crowd of citizens, following the path Rama took into exile.

He travels to a river crossing where Rama is said to have stayed, guided by a boatman named Guha. Bharata arrives at that exact spot, ready to plead with his brother to come home.

Rama isn't there. He has already moved on, deeper into the forest, toward a hill called Chitrakoot.

The place wasn't wrong — it was a real stop on Rama's journey, exactly as Bharata had been told. It just no longer held what he was looking for. So he presses on, until he finally finds Rama at Chitrakoot with Sita and Lakshmana.`,
  storyIntroLine: `"Let me tell you about a place that was exactly right — and still turned out to be empty."`,
  storyDialogue: [
    { speaker: "Bharata", line: "I've come looking for my brother Rama. Guha, is he here?" },
    { speaker: "Guha", line: "He was here. He stayed a while, then crossed the river and moved on." },
    { speaker: "Bharata", line: "Then where is he now?" },
    { speaker: "Guha", line: "He spoke of a hill called Chitrakoot. That's all I know." },
    { speaker: "Bharata", line: "Then that's where I'll go too." },
  ],
  storyOutroQuestion: `"Bharata went to the exact right place, and it was still empty. What do you think that means, when the place you're looking for used to have what you needed?"`,

  pauseQuestion: "In Python, what happens when your code tries to open a file at a path that turns out not to exist on the computer at all?",
  pauseChoices: [
    "Python creates an empty file automatically",
    "Python raises a FileNotFoundError",
    "Python looks in nearby folders for a similarly named file",
    "Python returns an empty string instead of the file's contents",
  ],
  pauseCorrectChoice: 1,

  conceptExplainer: `A FileNotFoundError happens when your code tries to open a file at a path that doesn't actually exist on the filesystem at that moment.

  with open("chitrakoot_notes.txt") as f:
      content = f.read()

If no file with that exact name exists in that exact location, Python doesn't invent one or guess a nearby match — it stops and tells you plainly that there's nothing there to open.`,

  mappingExplainer: `This is a slightly different flavor of "not found" than a KeyError. A KeyError happens inside your own program — you're asking your own dictionary for something you genuinely never put into it. A FileNotFoundError reaches outside your program, into the actual filesystem, which your code doesn't fully control and can't always predict in advance.

Bharata's search has that same outward-facing uncertainty. Guha's crossing was a real, correctly-identified location — not a wrong guess — and it still didn't have what he needed, because the world outside his plan had moved on since he last had information about it. That's the honest situation FileNotFoundError describes: the path was reasonable, the resource simply isn't there right now, and your code needs a plan for that possibility before it ever runs.`,

  codeExamples: [
    {
      label: "Unhandled — the program crashes",
      language: "python",
      code: `with open("chitrakoot_notes.txt") as f:
    content = f.read()
# Traceback (most recent call last):
#   ...
# FileNotFoundError: [Errno 2] No such file or directory: 'chitrakoot_notes.txt'`,
    },
    {
      label: "Handled — the program responds",
      language: "python",
      code: `try:
    with open("chitrakoot_notes.txt") as f:
        content = f.read()
except FileNotFoundError:
    content = "No notes found yet — the journey continues."

print(content)
# No notes found yet — the journey continues.`,
    },
  ],

  practiceLadder: [
    {
      stage: "predict",
      prompt: "This tries to open a log file that only gets created after a user's first save. Will the very first run of this program raise a FileNotFoundError? What about the second run?",
      starterCode: `with open("user_progress.log") as f:
    print(f.read())`,
    },
    {
      stage: "debug",
      prompt: "This function loads a saved character sheet, but crashes for any player who hasn't saved one yet. Fix it so a first-time player gets a fresh default sheet instead of a crash.",
      starterCode: `def load_character(player_name):
    with open(f"{player_name}.json") as f:
        return f.read()

print(load_character("new_player"))`,
      solutionCode: `def load_character(player_name):
    try:
        with open(f"{player_name}.json") as f:
            return f.read()
    except FileNotFoundError:
        return '{"level": 1, "items": []}'

print(load_character("new_player"))`,
    },
    {
      stage: "apply",
      prompt: "A photo-editing app tries to load a user's last-used filter preset from disk on startup. What real-world scenario (think: a brand-new install) causes a FileNotFoundError here, and what should the app do instead of crashing on launch?",
    },
  ],

  reflectionPrompt:
    "Guha's crossing wasn't the wrong place to look — it was simply no longer where Rama was. Where else does correctly following the information you had still lead you to an empty spot, with the real destination one step further on?",

  badgeUnlocked: "Chitrakoot — Where the Search Continues",
};

export default fileNotFoundError;