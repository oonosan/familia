import { usePersisted } from "./usePersisted";
import { useCarousel } from "./useCarousel";
import Hero from "./components/Hero";
import Invitados from "./components/Invitados";
import Gastos from "./components/Gastos";
import Alcanza from "./components/Alcanza";

const PANES = ["hero", "invitados", "gastos", "alcanza"];

export default function App() {
  const {
    invitados, gastos, config,
    addInvitado, patchInvitado, borrarInvitado,
    addGasto, patchGasto, borrarGasto,
    guardarConfig,
  } = usePersisted();

  const { trackRef, registerPane, current, goTo } = useCarousel(PANES.length);

  return (
    <>
      <div className="carousel" id="carousel">
        <div className="track" id="track" ref={trackRef}>
          <section className="pane" id="pane-0" ref={registerPane(0)} tabIndex={-1}>
            <Hero onScrollHint={() => goTo(1)} />
          </section>

          <section className="pane" id="pane-1" ref={registerPane(1)} tabIndex={-1}>
            <div className="wrap">
              <Invitados
                invitados={invitados}
                addInvitado={addInvitado}
                patchInvitado={patchInvitado}
                borrarInvitado={borrarInvitado}
              />
            </div>
          </section>

          <section className="pane" id="pane-2" ref={registerPane(2)} tabIndex={-1}>
            <div className="wrap">
              <Gastos
                invitados={invitados}
                gastos={gastos}
                addGasto={addGasto}
                patchGasto={patchGasto}
                borrarGasto={borrarGasto}
              />
            </div>
          </section>

          <section className="pane" id="pane-3" ref={registerPane(3)} tabIndex={-1}>
            <div className="wrap">
              <Alcanza invitados={invitados} gastos={gastos} config={config} guardarConfig={guardarConfig} />
              <footer>Gaia · 18 de octubre · cumple y bautismo</footer>
            </div>
          </section>
        </div>
      </div>

      <nav className="dots" aria-label="Secciones">
        {PANES.map((nombre, i) => (
          <button
            key={nombre}
            type="button"
            data-goto={i}
            aria-label={"Ir a " + nombre}
            aria-current={i === current ? "true" : "false"}
            onClick={() => goTo(i)}
          />
        ))}
      </nav>
    </>
  );
}
