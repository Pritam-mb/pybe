/* ============================================================
   CLASSES & OBJECTS EXPERIENCE — lesson data
   8 stages: story → problem → thoughts → blueprint → self → constructor → inheritance → challenge
   ============================================================ */

export const STAGES = [
  { id: "story",       title: "A game needs characters",          subtitle: "Where the problem begins" },
  { id: "problem",     title: "How would you organise this?",     subtitle: "Think before you code" },
  { id: "thought-paths", title: "Choose your approach",          subtitle: "Each leads somewhere different" },
  { id: "blueprint",   title: "The class blueprint",              subtitle: "One structure, many objects" },
  { id: "self",        title: "What is self?",                    subtitle: "How a method knows which object to act on" },
  { id: "constructor", title: "The constructor — __init__",       subtitle: "How an object comes to life" },
  { id: "inheritance", title: "Parent and child classes",         subtitle: "Sharing and overriding behaviour" },
  { id: "challenge",   title: "Build it yourself",                subtitle: "Create classes, objects, and override a method" },
];

export const THOUGHT_OPTIONS = [
  {
    letter: "A",
    text: "Create separate variables and functions for every character.",
    feedbackType: "warning",
    feedback:
      "That works for two characters. But now imagine 20 enemies and 5 players. You'd have player1_health, player2_health, enemy1_health… and take_damage_player1, take_damage_player2… The code becomes impossible to change. Every bug fix needs to be applied in 25 places.",
  },
  {
    letter: "B",
    text: "Create one reusable structure and create different characters from it.",
    feedbackType: "good",
    feedback:
      "Exactly the right instinct. A single structure that describes what every character is and can do — then each actual character is a separate instance with its own values. This is what a class gives you. You define the structure once and create as many objects as you need.",
  },
  {
    letter: "C",
    text: "Put everything into one big dictionary for each character.",
    feedbackType: "insight",
    feedback:
      "A dictionary is a reasonable first step. player1 = {'name': 'A', 'health': 100} works. But when you add methods — take_damage, heal — where do they live? Dictionaries hold data, not behaviour. A class binds data and behaviour together in one place, which is the key advantage.",
  },
  {
    letter: "D",
    text: "I'm not sure.",
    feedbackType: "insight",
    feedback:
      "Let's think about it differently. Every character shares the same shape: name, health, position, move(), attack(). If you had a template that captured that shape, you could stamp out new characters by filling in the values. That template is a class. The stamped-out characters are objects.",
  },
];

export const CHARACTER_CLASS_CODE = `class Character:
    def __init__(self, name, health):
        self.name = name
        self.health = health
        self.position = 0

    def move(self, distance):
        self.position += distance

    def take_damage(self, amount):
        self.health -= amount

player1 = Character("Aria", 100)
player2 = Character("Kabir", 75)

player1.take_damage(20)
player2.move(5)
print(player1.name, "health:", player1.health)
print(player2.name, "position:", player2.position)`;

export const INHERITANCE_CODE = `class Character:
    def __init__(self, name, health):
        self.name = name
        self.health = health

    def take_damage(self, amount):
        self.health -= amount

    def status(self):
        return f"{self.name}: {self.health} HP"

class Player(Character):
    def heal(self, amount):
        self.health += amount

class Enemy(Character):
    def __init__(self, name, health, strength):
        super().__init__(name, health)
        self.strength = strength

    def attack(self, target):
        target.take_damage(self.strength)

hero = Player("Aria", 100)
goblin = Enemy("Goblin", 40, 15)
goblin.attack(hero)
hero.heal(5)
print(hero.status())
print(goblin.status())`;

export const CHALLENGE_STARTER = `class Animal:
    def __init__(self, name, sound):
        self.name = name
        self.sound = sound

    def speak(self):
        return f"{self.name} says {self.sound}!"

# TODO 1: Create a Dog class that inherits from Animal
# TODO 2: Override speak() to say "WOOF" in uppercase
# TODO 3: Create a dog object and call speak()

`;

export const SELF_ANIMATION_STEPS = [
  { label: "Call", code: "player1.take_damage(20)", desc: "A method call on an object" },
  { label: "Route", code: "Character.take_damage(player1, 20)", desc: "Python routes the call to the class — player1 becomes self" },
  { label: "Inside", code: "self → player1", desc: "Inside the method, self is player1" },
  { label: "Read", code: "self.health  →  100", desc: "self.health reads player1's health" },
  { label: "Write", code: "self.health = 100 - 20 = 80", desc: "player1.health is now 80" },
  { label: "Done", code: "player1.health = 80", desc: "Only player1 was modified — player2 is unchanged" },
];

export const INHERITANCE_CONCEPTS = [
  {
    title: "Inheritance",
    desc: "A child class receives all methods and attributes of its parent automatically.",
    icon: "🧬",
  },
  {
    title: "Method Overriding",
    desc: "A child can replace a parent method with its own version. Same name, different behaviour.",
    icon: "✏️",
  },
  {
    title: "Polymorphism",
    desc: "Different object types can be treated the same way. status() works on both Player and Enemy.",
    icon: "🔀",
  },
  {
    title: "super()",
    desc: "A child can call the parent's __init__ to set up shared attributes before adding its own.",
    icon: "⬆️",
  },
];
