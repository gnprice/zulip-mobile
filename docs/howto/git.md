# Using Git

Git is a complex and powerful tool.  With some effort you can learn to do a
lot of things with it that make everyday workflows easier, help you produce
better code, and even help you understand a codebase better.

## Essentials

If you don't feel you have time to dig deep into Git right now, you should
still take a few minutes to do the bits in this section.

1. Get and use a graphical client (details below).  It helps a lot for
   seeing and understanding what's happening.

2. Try out [the "secret"](#git-log-secret) below for using
   `git log -p` effectively.

Then do come back and read more later. ;-)


## Setup

### Graphical client

It's important to have a graphical Git viewer/client you can use.  Any time
you do a rebase that's at all complex, or do anything where you're not 100%
sure what's happening in the repo, pull up the graphical client.

This can make a big difference in helping you see what things look like and
what your commands are doing.  That not only helps you do whatever you're
doing right now, but also means you'll learn Git faster.

For suggested clients, see [the Zulip
docs](https://zulip.readthedocs.io/en/latest/git/setup.html#get-a-graphical-client).


## Reading history

One of the things that makes Git so valuable is its facilities for
studying history -- both
* very recent history (e.g., rereading your own branch before you
  send a PR), and
* the distant past (e.g., tracking down when and why some piece
  of code became the way it is.)

This section will help you take advantage of these powerful abilities.


### 1. Use your graphical client

One great way to read history: use your graphical Git client!
Especially helpful for
* reading through the recent commits, or
* clarifying how branches are related to each other.


<div id="git-log-secret" />

### 2. The "secret" to using `git log -p`

Use `git log -p`, with this important secret:

* In the pager that `git log` puts you into, hit `/` to search, then enter
  the pattern `^c` -- that is, caret, then `c`.  Then hit `n`/`N` for
  next/previous match.

* This finds lines that begin with `c`.  Because of thoughtful design in
  the default format of `git log`, these are exactly the first line of the
  log entry for each commit.  So with this search pattern, you effectively
  get **keybindings for "next/previous commit"**.  This makes a huge
  difference in skimming quickly past boring commits without missing
  anything.

* For a further upgrade, use `git log --stat -p` (you might alias this as
  e.g. `git lsp`.)  Now every time you hit `n` or `N`, you see the commit
  message and complete list of affected files for the new commit -- a good
  summary to help decide whether to read in more detail or hit `n`/`N`
  again to move on.


### 3. Filter `git log` down to relevant commits

Use some of `git log`'s many features to filter down to commits you
care about.  For example:

* Filter to a range of commits with `git log A..B`.  E.g., to reread your
  current branch relative to upstream master, you might say
  `git log --stat -p upstream/master..`, or `git log --stat -p @{u}..`.
  (Greg has the latter aliased as `git usp`, and types it constantly.)

* Filter to changes touching certain files or directories:
  `git log PATHS`.

* Filter to changes touching lines that mention some pattern:
  `git log -G PATTERN`.

* Filter to changes adding or removing mentions of some pattern:
  `git log -S PATTERN`.  This feature is traditionally called the
  "pickaxe", presumably in honor of its power to mine just the right bit
  of historical/explanatory gold.

* Many more.  Do take a few minutes to skim through the documentation in
  `git help log` (or [this web version](https://git-scm.com/docs/git-log))
  to get an idea of what's available; and perhaps an hour now and then to
  read and try things in more detail.


### 4. Filter in your graphical client

Try all those `git log` filtering features in your graphical client -- it
may even support the very same command-line options to do it.  For
example, `gitk upstream/master..` shows basically the same information as
`git log --stat -p upstream/master..`, but graphically.


### 5. Git a summary, with `git log --oneline`

Try `git log --graph --oneline --decorate --boundary`.  (Quite a mouthful;
Greg has this aliased as `git k`, in homage to `gitk`.)  It can be a
lightweight alternative to your graphical client for simple, routine
situations, giving a compact list of commits each on just one line.

* To list the commits local to your current branch: `git k @{u}..`.
  (Greg has an alias for this, and types it constantly.)

* To list all your own local commits on all branches:
  `git k --branches @ --not --remotes=origin --remotes=upstream`.
  (For explanation, see `git help log`.)


## "Conflict resolution" made simple

Rebasing or merging is routine in Git.  In the Zulip workflow, we
especially use `git rebase -i` all the time.

When you rebase a commit past another that changes the same chunk of
code, Git hands you a *conflict* you have to resolve.  Out of the box,
this is often a tedious and error-prone task -- a big problem for a
rebase-heavy workflow like ours.  Fortunately, with a few key points
(that are not well documented!) and then a bit of practice, you can
learn to handle rebase conflicts quickly and reliably.


### Setup

First, as **one-time setup**: run `git config --global
merge.conflictstyle diff3`.

This adds an item to your `~/.gitconfig` that [causes Git's conflict
hunks][gitconfig-conflictstyle] to have one additional piece of
information we'll discuss below.

In the default configuration, it's actually **not possible** to
resolve typical conflicts correctly just by looking at the conflict
hunk Git leaves in the file -- the information you need simply isn't
there, leaving you to either guess, or try to reconstruct it from the
repo's history by hand.  No wonder people often make errors!

With the extra information from `diff3` and the approach below, it
becomes possible to resolve (in Greg's experience) the majority of
rebase conflicts in isolation, based on the conflict hunk alone,
without looking at any other code or any history; and the bulk of the
rest require only a vague idea of what the changes are doing.

[gitconfig-conflictstyle]: https://git-scm.com/docs/git-config#Documentation/git-config.txt-mergeconflictStyle


### Theory

Here's an example conflicted file, with the `diff3` setting:

```
w
<<<<<<<
x
|||||||
x
y
=======
y
>>>>>>>
z
```

This file has lines `w` and `z` before and after a conflict hunk.
Within the conflict hunk there are always three sections:

 * The top and bottom are the two *modified versions* of the code.
   Git calls them "ours" and "theirs", respectively.

   In the example, these are a line `x` and a line `y` respectively.

 * The middle is the *base version* of the code.  (This is the part
   that's missing by default, without `diff3`.)

   In the example, this is two lines `x` and `y`.

The idea is that the "base" is a common-ancestor version, and the
"ours" and "theirs" are two different ways the code has been
modified.  Like this, picturing it as two different branches:

         ---OURS
        /
    BASE
        \
         --THEIRS

So in our running example, we started with `x` and `y`... and OURS
deleted `y`, while THEIRS deleted `x`.

When resolving a Git conflict, our job is to make a version of the
code that's been *modified in both ways*.  We're working out a
*resolved version* that completes a diamond shape:

         ---OURS---
        /          \
    BASE            RESOLVED
        \          /
         --THEIRS--

so that these two things are true:

 * The difference OURS -> RESOLVED is "the same difference as"
   BASE -> THEIRS... in whatever way that best makes sense when
   starting from OURS.

 * The difference THEIRS -> RESOLVED is "the same difference as"
   BASE -> OURS... in whatever way that best makes sense when
   starting from THEIRS.


#### Tuning out history

In a rebase and especially a `rebase -i`, the actual history may not
cleanly map to the diamond diagram above.

This is an excellent reason to *tune out the actual commit history*
and focus purely on the conflict hunks and on the diagram's conceptual
history, with the three versions BASE, OURS, and THEIRS.

We're enjoying a division of labor between human and computer: Git's
machinery has dealt for you with the messy actual history.  It's
broken the overall merge/rebase problem down into lots of diamonds
like this to complete; and it's also taken care of numerous boring
cases, where OURS and THEIRS each modified different files in BASE or
separate parts of the same file.

The machine needs your help with just these few nuggets of code.  By
doing the parts the computer knows how to do, it's boiled the question
down to these (synthetic) diamond histories expressed in the conflict
hunks.  And with BASE included thanks to `diff3`, these boiled-down
subproblems have (usually) all the information needed for you to solve
them with your human intelligence and your knowledge of the language.


### The algorithm

Putting the problem in the way we did above leads to the following
algorithm for working out RESOLVED:

1. Examine how the code was changed in BASE -> OURS, and in BASE ->
   THEIRS.

2. Pick whichever of those changes is *simpler*: easier to understand,
   easier to apply, more independent of the rest of the code.

3. Edit the other modified version to apply your chosen change.  The
   result is the RESOLVED version.

4. Delete BASE, the `<<<`/`|||`/`===`/`>>>` marker lines, and the
   modified version you didn't edit, leaving only the new RESOLVED.

For example, if the change BASE -> THEIRS just renamed a function
while BASE -> OURS made bigger changes, you might pick BASE -> THEIRS
as simpler.  Then you'd edit OURS to rename the same function the same
way, and delete everything but OURS.

What does "simpler" mean?  No more than "whatever makes step 3
easier".  The algorithm gets the right result whichever change you
pick; the choice is only an optimization.

Finally, to check your work:

5. Run `git diff`.  This shows a special merged view, with two columns
   of `+`/`-` markers.

   This format is a bit confusing.  The meaning is that one column of
   markers shows the diff OURS -> RESOLVED, and the other shows THEIRS
   -> RESOLVED.

   If you've resolved things right, you should be able to look down
   one column and recognize BASE -> THEIRS, or the other column and
   recognize BASE -> OURS.

   In particular, if the two diffs have no lines in common -- if no
   lines start with `++` or `--` -- then that almost always means the
   resolution was right.


### Worked example 1

Take the "theory" section's example file:

```
w
<<<<<<<
x
|||||||
x
y
=======
y
>>>>>>>
z
```

So BASE is:
```
x
y
```

while OURS is:
```
x
```

and THEIRS is:
```
y
```

1. The change BASE -> OURS is "delete `y`", and the change BASE ->
   THEIRS is "delete `x`".

2. Both are equally simple.  We'll arbitrarily pick BASE -> OURS.

3. We edit the THEIRS section according to BASE -> OURS.  That means
   deleting `y` there, so the file becomes:

   ```
   w
   <<<<<<<
   x
   |||||||
   x
   y
   =======
   >>>>>>>
   z
   ```

4. We delete BASE, the marker lines, and OURS.  The final version of
   the file is:

   ```
   w
   z
   ```

The RESOLVED version is empty, containing nothing at all.  That's the
right result, because we started with lines `x` and `y` and applied
changes that deleted each of them.

5. Checking our work with `git diff`, we might see:

   ```
     w
   - x
    -y
     z
   ```

   The first column shows "deleted `x`" and the second shows "deleted
   `y`" -- which are the two changes we expected to see, so that
   checks out.  Also reassuring is that no lines are marked `++`,
   meaning every line was present in either OURS or THEIRS.


### Worked example 2 -- why `diff3` is essential

Consider a variation of the previous example:

```
w
<<<<<<<
x
|||||||
=======
y
>>>>>>>
z
```

Here OURS and THEIRS are exactly the same as before: the single lines
`x` and `y`.

But because BASE is now empty, the changes BASE -> OURS and BASE ->
THEIRS are the opposite of what they were: they *add* the lines `x`
and `y` respectively.

As a result, the correct RESOLVED version has *both* lines instead of
neither.  The correct resulting file is:

```
w
x
y
z
```

In Git's default configuration without `diff3`, both of these cases
would be presented in the exact same way, because BASE is left out:

```
w
<<<<<<<
x
=======
y
>>>>>>>
z
```

Because it's impossible to tell from this conflict hunk whether the
lines `x` and `y` were both added or both removed, it's impossible to
correctly resolve the conflict without looking around in (or happening
to already know and remember) the history in order to reconstruct the
changes.
