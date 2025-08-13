import { useUiScale } from "@features/ui/UiScaleProvider";

export function SettingsPage() {
  const { scale, setScale, options } = useUiScale();
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "1.25rem",
        maxWidth: 520,
      }}
    >
      <div>
        <h2 style={{ margin: 0 }}>Settings</h2>
        <p
          style={{
            margin: "0.35rem 0 0",
            fontSize: ".8rem",
            color: "var(--color-text-dim)",
          }}
        >
          Personalize your dashboard experience.
        </p>
      </div>

      <section
        style={{ display: "flex", flexDirection: "column", gap: ".9rem" }}
      >
        <header>
          <h3
            style={{
              margin: 0,
              fontSize: ".85rem",
              letterSpacing: ".08em",
              textTransform: "uppercase",
              color: "var(--color-text-dim)",
            }}
          >
            Interface Scale
          </h3>
        </header>
        <fieldset className="scale-fieldset">
          <legend className="visually-hidden">Interface scale presets</legend>
          <div
            className="scale-radio-group"
            role="radiogroup"
            aria-label="Interface scale presets"
          >
            {options.map((v) => {
              const id = `scale-${v}`.replace(/\./g, "-");
              const pct = v === 1 ? "100%" : `${Math.round(v * 100)}%`;
              return (
                <label
                  key={v}
                  className={
                    v === scale ? "scale-radio is-active" : "scale-radio"
                  }
                >
                  <input
                    type="radio"
                    id={id}
                    name="ui-scale"
                    value={v}
                    checked={v === scale}
                    onChange={() => setScale(v)}
                  />
                  <span>{pct}</span>
                </label>
              );
            })}
          </div>
        </fieldset>
        <div
          style={{
            fontSize: ".7rem",
            color: "var(--color-text-dim)",
            lineHeight: 1.4,
          }}
        >
          Current:{" "}
          <strong style={{ color: "var(--color-text)" }}>
            {Math.round(scale * 100)}%
          </strong>
          .
        </div>
        <div
          style={{
            display: "flex",
            gap: ".5rem",
            alignItems: "center",
            marginTop: ".1rem",
          }}
        >
          <label htmlFor="scaleRange" style={{ fontSize: ".65rem", width: 60 }}>
            Fine tune
          </label>
          <input
            id="scaleRange"
            type="range"
            min={0.9}
            max={1.6}
            step={0.01}
            value={scale}
            onChange={(e) => setScale(parseFloat(e.target.value))}
            style={{ flex: 1 }}
            aria-label="Fine tune interface scale"
          />
          <output style={{ fontSize: ".7rem", width: 46, textAlign: "right" }}>
            {(scale * 100).toFixed(0)}%
          </output>
        </div>
        <div style={{ display: "flex", gap: ".5rem" }}>
          <button
            type="button"
            className="btn-quiet"
            onClick={() => setScale(1)}
          >
            Reset
          </button>
        </div>
      </section>
    </div>
  );
}
