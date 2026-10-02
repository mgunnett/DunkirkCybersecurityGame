rulebookPage(String.raw`
# Decoding a Signal

Signals in cipher are decoded at the cipher desk, the folder beside the teleprinter. Pick up the slip as usual: when it carries a CYP line, the desk's tools open beside it.

## Step by step

- Read the CYP line. It names the key the signal was written under.
- Find that key in the **key tray** and drag it into the **slot**. The desk clips a key to the signals that name it, so it may already be there.
- Drag across the **punched tape**, or click a word, to decode it. The decoded letters appear underneath.
- Read what it says, then check it as you would any other signal.

The keyboard works as well: the arrow keys move along the tape, Shift extends the selection, and Enter decodes it.

## When it won't read

If the tape decodes to more nonsense, one of two things is true: you have the wrong key in the slot, or whoever sent the signal does not hold the key it claims. Clear the tape and try the key the CYP line names.

> A signal that reads under no key you trust is not from Dover. A signal that reads only under a key that came without warning is the enemy's.

## How the cipher works

The key word is written out over the message, again and again, one key letter over each letter of the message. Each key letter tells you how far along the alphabet to shift the letter beneath it: A shifts it not at all, B by one, C by two, and so on, round from Z back to A. To decode, shift back the other way.

~~~
MESSAGE  S T E E R
KEY      B O A T B
SENT     T H E X S
~~~

Under the key BOAT, S shifted by B (one place) becomes T, T shifted by O (fourteen places) becomes H, and so on. The same letter in the message comes out differently each time it appears, which is what makes the cipher hard to break without the key.

## Filing

Every slip you read is filed in the folder. Open it to read any signal again, to see your keys, and to lay a cipher beside the key that opens it.
`);
