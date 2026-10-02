rulebookPage(String.raw`
# Decoding a Signal

Decode signals at the cipher desk: the folder next to the telex. When you pick up a signal in cipher, the decoding tools open beside it.

## Step by step

- Look at the CYP line to see which key it needs.
- Drag that key from the **key tray** into the **slot**. It may already be there.
- Drag across the **punched tape**, or click a word, to decode it.
- Read the message, then check it like any other signal.

You can use the keyboard too: the arrow keys move, Shift selects, and Enter decodes.

## Still nonsense?

Either you used the wrong key, or the sender doesn't have the key they claim. Try the key named on the CYP line.

> A message that only makes sense with a fake key is from the enemy.

## How the cipher works

Each letter of the key says how far to move a letter of the message along the alphabet: A moves it 0, B moves it 1, C moves it 2, and so on. After Z, start again at A. The key repeats along the whole message. To decode, move each letter back.

~~~
MESSAGE  S T E E R
KEY      B O A T B
SENT     T H E X S
~~~

S moved 1 (B) is T. T moved 14 (O) is H. Because the key letter changes each time, the same letter can turn into different letters: here one E stays E and the other becomes X.
`);
