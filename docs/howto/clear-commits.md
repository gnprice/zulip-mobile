# Writing "clear and coherent" commits

In the Zulip project, we aim to maintain a high standard of the code
being *clear*, i.e. easy to read and understand.

Part of doing this is in the source tree itself: giving the code an
appropriate structure, choosing good names for things, applying static
types, writing comments where helpful.

Another part of it is in the *history* of the code.  With [a little
practice](git.md), Git makes it easy for a person reading the code to
look at the relevant commits where we added some logic or made things
work a certain way, and this can be a powerful way to help understand
it.

TODO TODO

* separate
* each one breaks nothing
   * https://github.com/zulip/zulip-mobile/pull/2789#issuecomment-422999536
   * `for i in {28..0}; do git co master~$i && yarn flow || break; done`
* each one answers:
   * why is this good?
   * why is this not bad?
* message vs. comments:
   * comments (better yet, structure and names) explain this code as
     it is
   * message explains this version in contrast to previous
   * no need to duplicate when some info is useful for both; if commit
     is short, comments speak for themselves; if long, put a quick
     pointer in the message
* large mechanical changes separate from interesting changes
   * e.g. rename something: keep that commit to absolute minimum to
     not break, then stuff any interesting changes in followup
   * e.g. upgrade some dep and it requires changes: try hard to make
     those changes come separately either before or after
