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
        <p className="card-sub" style={{ margin: ".35rem 0 0" }}>
          Personalize your dashboard experience.
        </p>
      </div>

      <section
        style={{ display: "flex", flexDirection: "column", gap: ".9rem" }}
      >
        <header>
          <h3 className="profile-label" style={{ margin: 0 }}>
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
                  htmlFor={id}
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
          className="scale-fine-row"
          style={{
            display: "flex",
            alignItems: "center",
            gap: ".6rem",
            marginTop: ".15rem",
          }}
        >
          <label
            htmlFor="scaleRange"
            className="small-text"
            style={{ width: 70 }}
          >
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
            style={{ flex: 1, minWidth: 0 }}
            aria-label="Fine tune interface scale"
          />
          <output
            className="small-text"
            style={{ width: 46, textAlign: "right" }}
          >
            {(scale * 100).toFixed(0)}%
          </output>
          <button
            type="button"
            className="btn-quiet reset-btn"
            onClick={() => setScale(1)}
            aria-label="Reset interface scale to 100 percent"
            title="Reset"
            style={{ flex: "0 0 auto" }}
          >
            Reset
          </button>
        </div>
      </section>
    </div>
  );
}
