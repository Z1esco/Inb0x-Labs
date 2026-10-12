import { Icon } from "@/components/icons";

export function HeroCorrespondence() {
  return (
    <div
      className="hero-correspondence"
      aria-label="Illustrative email becoming a decision"
      data-reveal
    >
      <div className="hero-letter">
        <div className="hero-letter-top">
          <Icon name="inbox" />
          <span>A conversation, in focus</span>
        </div>
        <div className="hero-sender">
          <span className="example-avatar" aria-hidden="true">
            M
          </span>
          <div>
            <strong>Maya at Northstar</strong>
            <span>Fictional correspondence</span>
          </div>
          <Icon name="arrow" />
        </div>
        <h2>
          One last thing
          <br />
          before we move ahead.
        </h2>
        <p>
          Please approve the Aurora proposal <mark>by 5:00 PM tomorrow</mark> so
          procurement can submit it.
        </p>
        <div className="hero-letter-bottom">
          <Icon name="search" />
          <span>The original wording stays close.</span>
        </div>
      </div>
      <div className="hero-decision">
        <div className="hero-decision-heading">
          <Icon name="activity" />
          <span>What needs your attention</span>
        </div>
        <strong>Review the Aurora proposal</strong>
        <p>A decision to make. A deadline to verify.</p>
        <div>
          <span>Source-linked suggestion</span>
          <Icon name="arrow" />
        </div>
      </div>
    </div>
  );
}
