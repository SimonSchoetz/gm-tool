# Example usage for HoloFX

The Holo FX is rather complicated, especially when there are mouse events involved. The hook contains the logic for tracking the mouse and updating values und must be used in the component that also handles onClick events.
It is also important you use the `holo-fx`class in this component.

The HookFX component has the shimmer and glare effects which should be used within the component that is clickable. Check out the `AdventureList` when uncertain of its usage.

```ts
export const HoloExample: FCProps<Props> = ({
  className,
  children,
  ...props
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { cardVars } = useHoloMovement(containerRef);

  return (
    <div
      ref={containerRef}
      className={cn('holo-fx', className)}
      style={cardVars}
      {...props}
    >
      <div className={cn('holo-fx__rotator')}>
        {children}
        <HoloFX />
      </div>
    </div>
  );
};
```
