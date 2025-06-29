// Statistical Analysis Engine for A/B Testing
export interface VariationMetrics {
  variationId: string;
  visitors: number;
  conversions: number;
  conversionRate: number;
  revenue?: number;
  revenuePerVisitor?: number;
  confidenceInterval: [number, number];
  probabilityToBeatControl: number;
  expectedLoss: number;
}

export interface PowerAnalysis {
  currentPower: number;
  requiredSampleSize: number;
  daysToCompletion: number;
  isUnderpowered: boolean;
}

export interface StatisticalSignificance {
  isSignificant: boolean;
  confidenceLevel: number;
  pValue: number;
  effect: number;
  powerAnalysis: PowerAnalysis;
}

export class StatisticalAnalysisEngine {
  // Calculate confidence interval for conversion rate
  calculateConfidenceInterval(conversionRate: number, sampleSize: number, confidenceLevel: number): [number, number] {
    if (sampleSize === 0) return [0, 0];

    const z = this.getZScore(confidenceLevel);
    const standardError = Math.sqrt((conversionRate * (1 - conversionRate)) / sampleSize);
    const marginOfError = z * standardError;

    return [
      Math.max(0, conversionRate - marginOfError),
      Math.min(1, conversionRate + marginOfError)
    ];
  }

  // Calculate probability that variation beats control
  calculateProbabilityToBeatControl(
    variationRate: number,
    variationSize: number,
    controlRate: number,
    controlSize: number
  ): number {
    if (variationSize === 0 || controlSize === 0) return 0.5;

    const variationVariance = (variationRate * (1 - variationRate)) / variationSize;
    const controlVariance = (controlRate * (1 - controlRate)) / controlSize;
    const standardError = Math.sqrt(variationVariance + controlVariance);

    if (standardError === 0) return variationRate > controlRate ? 1 : 0;

    const zScore = (variationRate - controlRate) / standardError;
    return this.normalCDF(zScore);
  }

  // Calculate expected loss from choosing variation over control
  calculateExpectedLoss(variationRate: number, controlRate: number, sampleSize: number): number {
    const difference = controlRate - variationRate;
    return Math.max(0, difference * sampleSize);
  }

  // Calculate statistical significance for A/B test
  async calculateSignificance(variations: VariationMetrics[], confidenceLevel: number): Promise<StatisticalSignificance> {
    const control = variations.find(v => v.variationId.includes('control') || variations.indexOf(v) === 0);
    if (!control) {
      throw new Error('Control variation not found');
    }

    let isSignificant = false;
    let pValue = 1;
    let effect = 0;

    // Find the best performing variation
    const bestVariation = variations.reduce((prev, current) =>
      current.conversionRate > prev.conversionRate ? current : prev
    );

    if (bestVariation !== control) {
      // Perform two-proportion z-test
      const result = this.twoProportionZTest(
        control.conversions, control.visitors,
        bestVariation.conversions, bestVariation.visitors
      );

      pValue = result.pValue;
      isSignificant = pValue < (1 - confidenceLevel);
      effect = bestVariation.conversionRate - control.conversionRate;
    }

    // Calculate power analysis
    const powerAnalysis = this.calculatePowerAnalysis(variations, confidenceLevel);

    return {
      isSignificant,
      confidenceLevel,
      pValue,
      effect,
      powerAnalysis
    };
  }

  // Two-proportion z-test
  private twoProportionZTest(
    x1: number, n1: number,
    x2: number, n2: number
  ): { zScore: number; pValue: number } {
    if (n1 === 0 || n2 === 0) return { zScore: 0, pValue: 1 };

    const p1 = x1 / n1;
    const p2 = x2 / n2;
    const pPooled = (x1 + x2) / (n1 + n2);

    const standardError = Math.sqrt(pPooled * (1 - pPooled) * (1/n1 + 1/n2));

    if (standardError === 0) return { zScore: 0, pValue: 1 };

    const zScore = (p2 - p1) / standardError;
    const pValue = 2 * (1 - this.normalCDF(Math.abs(zScore)));

    return { zScore, pValue };
  }

  // Calculate power analysis
  private calculatePowerAnalysis(variations: VariationMetrics[], confidenceLevel: number): PowerAnalysis {
    const totalSampleSize = variations.reduce((sum, v) => sum + v.visitors, 0);
    const control = variations[0]; // Assume first is control

    if (control.visitors === 0) {
      return {
        currentPower: 0,
        requiredSampleSize: 1000,
        daysToCompletion: 7,
        isUnderpowered: true
      };
    }

    // Estimate minimum detectable effect (5% relative improvement)
    const minimumDetectableEffect = control.conversionRate * 0.05;

    // Calculate required sample size for 80% power
    const alpha = 1 - confidenceLevel;
    const beta = 0.2; // 80% power
    const zAlpha = this.getZScore(1 - alpha/2);
    const zBeta = this.getZScore(1 - beta);

    const p1 = control.conversionRate;
    const p2 = p1 + minimumDetectableEffect;
    const pAvg = (p1 + p2) / 2;

    const requiredSampleSizePerVariation = Math.ceil(
      (Math.pow(zAlpha + zBeta, 2) * 2 * pAvg * (1 - pAvg)) / Math.pow(p2 - p1, 2)
    );

    const requiredSampleSize = requiredSampleSizePerVariation * variations.length;

    // Calculate current power
    const effectSize = Math.abs(variations[1]?.conversionRate - p1) / Math.sqrt(pAvg * (1 - pAvg));
    const currentPower = control.visitors > 0 ?
      this.normalCDF(effectSize * Math.sqrt(control.visitors) - zAlpha) : 0;

    // Estimate days to completion (assume 100 samples per day per variation)
    const samplesPerDay = Math.max(1, totalSampleSize / 7); // Estimate based on last week
    const remainingSamples = Math.max(0, requiredSampleSize - totalSampleSize);
    const daysToCompletion = remainingSamples / samplesPerDay;

    return {
      currentPower,
      requiredSampleSize,
      daysToCompletion,
      isUnderpowered: currentPower < 0.8
    };
  }

  // Get z-score for confidence level
  private getZScore(confidenceLevel: number): number {
    // Approximate z-scores for common confidence levels
    if (confidenceLevel >= 0.99) return 2.576;
    if (confidenceLevel >= 0.95) return 1.96;
    if (confidenceLevel >= 0.90) return 1.645;
    if (confidenceLevel >= 0.80) return 1.28;

    // For other values, use inverse normal approximation
    return this.inverseNormalCDF(confidenceLevel);
  }

  // Normal CDF approximation
  private normalCDF(x: number): number {
    return (1 + this.erf(x / Math.sqrt(2))) / 2;
  }

  // Inverse normal CDF approximation
  private inverseNormalCDF(p: number): number {
    // Approximation using rational function
    if (p <= 0) return -Infinity;
    if (p >= 1) return Infinity;
    if (p === 0.5) return 0;

    const a = [0, -3.969683028665376e+01, 2.209460984245205e+02, -2.759285104469687e+02, 1.383577518672690e+02, -3.066479806614716e+01, 2.506628277459239e+00];
    const b = [0, -5.447609879822406e+01, 1.615858368580409e+02, -1.556989798598866e+02, 6.680131188771972e+01, -1.328068155288572e+01];

    const c = [0, -7.784894002430293e-03, -3.223964580411365e-01, -2.400758277161838e+00, -2.549732539343734e+00, 4.374664141464968e+00, 2.938163982698783e+00];
    const d = [0, 7.784695709041462e-03, 3.224671290700398e-01, 2.445134137142996e+00, 3.754408661907416e+00];

    let x: number;

    if (p < 0.5) {
      const t = Math.sqrt(-2 * Math.log(p));
      x = ((((((c[6]*t + c[5])*t + c[4])*t + c[3])*t + c[2])*t + c[1])*t + c[0]);
      x /= (((d[4]*t + d[3])*t + d[2])*t + d[1])*t + 1;
      x = -x;
    } else {
      const t = Math.sqrt(-2 * Math.log(1 - p));
      x = ((((((c[6]*t + c[5])*t + c[4])*t + c[3])*t + c[2])*t + c[1])*t + c[0]);
      x /= (((d[4]*t + d[3])*t + d[2])*t + d[1])*t + 1;
    }

    return x;
  }

  // Error function approximation
  private erf(x: number): number {
    // Abramowitz and Stegun approximation
    const a1 =  0.254829592;
    const a2 = -0.284496736;
    const a3 =  1.421413741;
    const a4 = -1.453152027;
    const a5 =  1.061405429;
    const p  =  0.3275911;

    const sign = x >= 0 ? 1 : -1;
    x = Math.abs(x);

    const t = 1 / (1 + p * x);
    const y = 1 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

    return sign * y;
  }
}
