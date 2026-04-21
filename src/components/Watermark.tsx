import styled from 'styled-components';

export default function Watermark() {
  return (
    <>
      <WatermarkFixed>
        <WatermarkText>2mcode</WatermarkText>
      </WatermarkFixed>

      <CornerWatermark>
        <CornerBadge>
          Design by <CornerBrand>2mcode</CornerBrand>
        </CornerBadge>
      </CornerWatermark>
    </>
  );
}

const WatermarkFixed = styled.div`
  position: fixed;
  inset: 0;
  z-index: 9999;
  pointer-events: none;
  user-select: none;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
`;

const WatermarkText = styled.span`
  font-size: 20vw;
  font-weight: 900;
  letter-spacing: -0.05em;
  color: #1e293b;
  opacity: 0.1;
  transform: rotate(-45deg);
  mix-blend-mode: multiply;
`;

const CornerWatermark = styled.div`
  position: fixed;
  bottom: 1.5rem;
  right: 1.5rem;
  z-index: 9999;
  pointer-events: none;
  user-select: none;
`;

const CornerBadge = styled.span`
  background: #ffffff;
  padding: 0.75rem 1.25rem;
  border-radius: 12px;
  border: 2px solid #e2e8f0;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  font-size: 13px;
  font-weight: 900;
  color: #1e293b;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const CornerBrand = styled.span`
  color: #0066ff;
`;
