# frontend implementation

- Zed coloring: html vs JSX component color difference like in cursor?
-
- Spec writer needs understanding of default layout/style guide
  - Screens use Glasspanel as base component
    - parallel to the glasspanel is the pop up container for error/warning messages
  - Should look for components that mirror html components and use them instead (eg html -> <input> vs custom component -> <Input>)
  - instructions about 'not using px' in .css not explicit enough -> should always use variables and if none exist but pattern strongly suggests a new valiue, it should be surfaced to the user
