export interface MLPrediction {
  type: "price" | "opportunity" | "risk" | "gas" | "mev"
  prediction: number
  confidence: number
  factors: string[]
  timestamp: number
  timeframe: string
}

export interface TrainingData {
  features: number[]
  target: number
  timestamp: number
  metadata?: any
}

export interface ModelMetrics {
  accuracy: number
  precision: number
  recall: number
  f1Score: number
  mse: number
  mae: number
  lastTrained: number
  trainingSize: number
}

export interface FeatureImportance {
  feature: string
  importance: number
  description: string
}

export class MachineLearningService {
  private models: Map<string, any> = new Map()
  private trainingData: Map<string, TrainingData[]> = new Map()
  private modelMetrics: Map<string, ModelMetrics> = new Map()
  private isTraining = false
  private retrainingInterval: NodeJS.Timeout | null = null

  constructor() {
    this.initializeModels()
    this.startRetrainingSchedule()
  }

  /**
   * Initialize ML models
   */
  private initializeModels() {
    // Initialize different model types
    this.models.set("price_prediction", new PricePredictionModel())
    this.models.set("opportunity_scoring", new OpportunityScoringModel())
    this.models.set("risk_assessment", new RiskAssessmentModel())
    this.models.set("gas_optimization", new GasOptimizationModel())
    this.models.set("mev_detection", new MEVDetectionModel())

    console.log("🤖 ML models initialized")
  }

  /**
   * Predict price movement
   */
  async predictPrice(
    symbol: string,
    timeframe: "1m" | "5m" | "15m" | "1h" | "4h" | "1d",
    features: number[],
  ): Promise<MLPrediction> {
    const model = this.models.get("price_prediction")
    if (!model) throw new Error("Price prediction model not available")

    try {
      const prediction = await model.predict(features)
      const confidence = this.calculateConfidence(prediction, features, "price")

      return {
        type: "price",
        prediction: prediction.value,
        confidence,
        factors: prediction.factors || [],
        timestamp: Date.now(),
        timeframe,
      }
    } catch (error) {
      console.error("Price prediction error:", error)
      throw error
    }
  }

  /**
   * Score arbitrage opportunity
   */
  async scoreOpportunity(opportunityData: any): Promise<MLPrediction> {
    const model = this.models.get("opportunity_scoring")
    if (!model) throw new Error("Opportunity scoring model not available")

    try {
      const features = this.extractOpportunityFeatures(opportunityData)
      const prediction = await model.predict(features)
      const confidence = this.calculateConfidence(prediction, features, "opportunity")

      return {
        type: "opportunity",
        prediction: prediction.score,
        confidence,
        factors: prediction.factors || [],
        timestamp: Date.now(),
        timeframe: "1m",
      }
    } catch (error) {
      console.error("Opportunity scoring error:", error)
      throw error
    }
  }

  /**
   * Assess risk level
   */
  async assessRisk(tradeData: any): Promise<MLPrediction> {
    const model = this.models.get("risk_assessment")
    if (!model) throw new Error("Risk assessment model not available")

    try {
      const features = this.extractRiskFeatures(tradeData)
      const prediction = await model.predict(features)
      const confidence = this.calculateConfidence(prediction, features, "risk")

      return {
        type: "risk",
        prediction: prediction.riskLevel,
        confidence,
        factors: prediction.factors || [],
        timestamp: Date.now(),
        timeframe: "1m",
      }
    } catch (error) {
      console.error("Risk assessment error:", error)
      throw error
    }
  }

  /**
   * Optimize gas price
   */
  async optimizeGas(networkData: any): Promise<MLPrediction> {
    const model = this.models.get("gas_optimization")
    if (!model) throw new Error("Gas optimization model not available")

    try {
      const features = this.extractGasFeatures(networkData)
      const prediction = await model.predict(features)
      const confidence = this.calculateConfidence(prediction, features, "gas")

      return {
        type: "gas",
        prediction: prediction.optimalGasPrice,
        confidence,
        factors: prediction.factors || [],
        timestamp: Date.now(),
        timeframe: "1m",
      }
    } catch (error) {
      console.error("Gas optimization error:", error)
      throw error
    }
  }

  /**
   * Detect MEV activity
   */
  async detectMEV(transactionData: any): Promise<MLPrediction> {
    const model = this.models.get("mev_detection")
    if (!model) throw new Error("MEV detection model not available")

    try {
      const features = this.extractMEVFeatures(transactionData)
      const prediction = await model.predict(features)
      const confidence = this.calculateConfidence(prediction, features, "mev")

      return {
        type: "mev",
        prediction: prediction.mevProbability,
        confidence,
        factors: prediction.factors || [],
        timestamp: Date.now(),
        timeframe: "1m",
      }
    } catch (error) {
      console.error("MEV detection error:", error)
      throw error
    }
  }

  /**
   * Add training data
   */
  addTrainingData(modelType: string, data: TrainingData) {
    if (!this.trainingData.has(modelType)) {
      this.trainingData.set(modelType, [])
    }

    const modelData = this.trainingData.get(modelType)!
    modelData.push(data)

    // Keep only recent data (last 10000 samples)
    if (modelData.length > 10000) {
      modelData.splice(0, modelData.length - 10000)
    }

    // Trigger retraining if enough new data
    if (modelData.length % 100 === 0) {
      this.scheduleRetraining(modelType)
    }
  }

  /**
   * Train model with accumulated data
   */
  async trainModel(modelType: string): Promise<ModelMetrics> {
    if (this.isTraining) {
      throw new Error("Training already in progress")
    }

    this.isTraining = true

    try {
      const model = this.models.get(modelType)
      const data = this.trainingData.get(modelType)

      if (!model || !data || data.length < 100) {
        throw new Error(`Insufficient data for training ${modelType}`)
      }

      console.log(`🎯 Training ${modelType} model with ${data.length} samples`)

      // Split data into training and validation sets
      const splitIndex = Math.floor(data.length * 0.8)
      const trainingSet = data.slice(0, splitIndex)
      const validationSet = data.slice(splitIndex)

      // Train the model
      await model.train(trainingSet)

      // Evaluate model performance
      const metrics = await this.evaluateModel(model, validationSet, modelType)
      this.modelMetrics.set(modelType, metrics)

      console.log(`✅ ${modelType} model trained. Accuracy: ${metrics.accuracy.toFixed(2)}%`)

      return metrics
    } catch (error) {
      console.error(`Training error for ${modelType}:`, error)
      throw error
    } finally {
      this.isTraining = false
    }
  }

  /**
   * Evaluate model performance
   */
  private async evaluateModel(model: any, validationData: TrainingData[], modelType: string): Promise<ModelMetrics> {
    let correct = 0
    let totalError = 0
    const predictions: number[] = []
    const actuals: number[] = []

    for (const sample of validationData) {
      try {
        const prediction = await model.predict(sample.features)
        const predictedValue =
          typeof prediction === "object" ? prediction.value || prediction.score || prediction.riskLevel : prediction

        predictions.push(predictedValue)
        actuals.push(sample.target)

        // Calculate accuracy for classification tasks
        if (Math.abs(predictedValue - sample.target) < 0.1) {
          correct++
        }

        // Calculate error for regression tasks
        totalError += Math.abs(predictedValue - sample.target)
      } catch (error) {
        console.error("Evaluation error:", error)
      }
    }

    const accuracy = (correct / validationData.length) * 100
    const mae = totalError / validationData.length
    const mse = this.calculateMSE(predictions, actuals)
    const { precision, recall, f1Score } = this.calculateClassificationMetrics(predictions, actuals)

    return {
      accuracy,
      precision,
      recall,
      f1Score,
      mse,
      mae,
      lastTrained: Date.now(),
      trainingSize: validationData.length,
    }
  }

  /**
   * Calculate Mean Squared Error
   */
  private calculateMSE(predictions: number[], actuals: number[]): number {
    if (predictions.length !== actuals.length) return 0

    const squaredErrors = predictions.map((pred, i) => Math.pow(pred - actuals[i], 2))
    return squaredErrors.reduce((sum, error) => sum + error, 0) / predictions.length
  }

  /**
   * Calculate classification metrics
   */
  private calculateClassificationMetrics(
    predictions: number[],
    actuals: number[],
  ): {
    precision: number
    recall: number
    f1Score: number
  } {
    if (predictions.length !== actuals.length) {
      return { precision: 0, recall: 0, f1Score: 0 }
    }

    // Convert to binary classification (threshold = 0.5)
    const binaryPreds = predictions.map((p) => (p > 0.5 ? 1 : 0))
    const binaryActuals = actuals.map((a) => (a > 0.5 ? 1 : 0))

    let tp = 0,
      fp = 0,
      fn = 0,
      tn = 0

    for (let i = 0; i < binaryPreds.length; i++) {
      if (binaryPreds[i] === 1 && binaryActuals[i] === 1) tp++
      else if (binaryPreds[i] === 1 && binaryActuals[i] === 0) fp++
      else if (binaryPreds[i] === 0 && binaryActuals[i] === 1) fn++
      else tn++
    }

    const precision = tp + fp > 0 ? tp / (tp + fp) : 0
    const recall = tp + fn > 0 ? tp / (tp + fn) : 0
    const f1Score = precision + recall > 0 ? (2 * (precision * recall)) / (precision + recall) : 0

    return { precision, recall, f1Score }
  }

  /**
   * Extract features for opportunity scoring
   */
  private extractOpportunityFeatures(data: any): number[] {
    return [
      data.priceSpread || 0,
      data.liquidity || 0,
      data.volume24h || 0,
      data.gasPrice || 0,
      data.slippage || 0,
      data.timeToExecution || 0,
      data.marketVolatility || 0,
      data.competitionLevel || 0,
      data.historicalSuccessRate || 0,
      data.networkCongestion || 0,
    ]
  }

  /**
   * Extract features for risk assessment
   */
  private extractRiskFeatures(data: any): number[] {
    return [
      data.amount || 0,
      data.gasPrice || 0,
      data.slippage || 0,
      data.mevRisk || 0,
      data.liquidityDepth || 0,
      data.priceVolatility || 0,
      data.timeToExecution || 0,
      data.networkCongestion || 0,
      data.competitorCount || 0,
      data.historicalFailureRate || 0,
    ]
  }

  /**
   * Extract features for gas optimization
   */
  private extractGasFeatures(data: any): number[] {
    return [
      data.currentGasPrice || 0,
      data.networkCongestion || 0,
      data.pendingTransactions || 0,
      data.blockUtilization || 0,
      data.mevActivity || 0,
      data.timeOfDay || 0,
      data.dayOfWeek || 0,
      data.historicalGasPrices || 0,
      data.priorityFee || 0,
      data.transactionSize || 0,
    ]
  }

  /**
   * Extract features for MEV detection
   */
  private extractMEVFeatures(data: any): number[] {
    return [
      data.gasPrice || 0,
      data.gasPriceRatio || 0,
      data.transactionValue || 0,
      data.timeInMempool || 0,
      data.similarTransactions || 0,
      data.frontrunningIndicators || 0,
      data.sandwichIndicators || 0,
      data.liquidationIndicators || 0,
      data.arbitrageIndicators || 0,
      data.botActivity || 0,
    ]
  }

  /**
   * Calculate prediction confidence
   */
  private calculateConfidence(prediction: any, features: number[], modelType: string): number {
    const metrics = this.modelMetrics.get(modelType)
    if (!metrics) return 50 // Default confidence

    let confidence = metrics.accuracy

    // Adjust based on feature quality
    const featureQuality = this.assessFeatureQuality(features)
    confidence *= featureQuality

    // Adjust based on model age
    const modelAge = Date.now() - metrics.lastTrained
    const ageHours = modelAge / (1000 * 60 * 60)
    if (ageHours > 24) {
      confidence *= Math.max(0.5, 1 - (ageHours - 24) / 168) // Decay over week
    }

    return Math.max(10, Math.min(95, confidence))
  }

  /**
   * Assess quality of input features
   */
  private assessFeatureQuality(features: number[]): number {
    let quality = 1.0

    // Check for missing or invalid features
    const invalidFeatures = features.filter((f) => isNaN(f) || !isFinite(f))
    if (invalidFeatures.length > 0) {
      quality *= Math.max(0.3, 1 - invalidFeatures.length / features.length)
    }

    // Check for extreme values
    const extremeFeatures = features.filter((f) => Math.abs(f) > 1000000)
    if (extremeFeatures.length > 0) {
      quality *= Math.max(0.7, 1 - (extremeFeatures.length / features.length) * 0.5)
    }

    return quality
  }

  /**
   * Schedule model retraining
   */
  private scheduleRetraining(modelType: string) {
    setTimeout(() => {
      this.trainModel(modelType).catch((error) => {
        console.error(`Scheduled retraining failed for ${modelType}:`, error)
      })
    }, 5000) // Delay to avoid frequent retraining
  }

  /**
   * Start automatic retraining schedule
   */
  private startRetrainingSchedule() {
    this.retrainingInterval = setInterval(() => {
      this.models.forEach((_, modelType) => {
        const data = this.trainingData.get(modelType)
        if (data && data.length >= 1000) {
          this.trainModel(modelType).catch((error) => {
            console.error(`Scheduled retraining failed for ${modelType}:`, error)
          })
        }
      })
    }, 3600000) // Retrain every hour
  }

  /**
   * Get model metrics
   */
  getModelMetrics(modelType?: string): ModelMetrics | Map<string, ModelMetrics> {
    if (modelType) {
      return (
        this.modelMetrics.get(modelType) || {
          accuracy: 0,
          precision: 0,
          recall: 0,
          f1Score: 0,
          mse: 0,
          mae: 0,
          lastTrained: 0,
          trainingSize: 0,
        }
      )
    }
    return new Map(this.modelMetrics)
  }

  /**
   * Get feature importance for a model
   */
  getFeatureImportance(modelType: string): FeatureImportance[] {
    const model = this.models.get(modelType)
    if (!model || !model.getFeatureImportance) {
      return []
    }

    return model.getFeatureImportance()
  }

  /**
   * Export model for backup
   */
  exportModel(modelType: string): any {
    const model = this.models.get(modelType)
    if (!model || !model.export) {
      throw new Error(`Model ${modelType} cannot be exported`)
    }

    return {
      modelType,
      modelData: model.export(),
      metrics: this.modelMetrics.get(modelType),
      exportTime: Date.now(),
    }
  }

  /**
   * Import model from backup
   */
  importModel(modelData: any) {
    const model = this.models.get(modelData.modelType)
    if (!model || !model.import) {
      throw new Error(`Model ${modelData.modelType} cannot be imported`)
    }

    model.import(modelData.modelData)
    if (modelData.metrics) {
      this.modelMetrics.set(modelData.modelType, modelData.metrics)
    }

    console.log(`✅ Imported ${modelData.modelType} model`)
  }

  /**
   * Get training data statistics
   */
  getTrainingDataStats(): Map<string, { count: number; lastUpdate: number }> {
    const stats = new Map()

    this.trainingData.forEach((data, modelType) => {
      const lastUpdate = data.length > 0 ? Math.max(...data.map((d) => d.timestamp)) : 0
      stats.set(modelType, {
        count: data.length,
        lastUpdate,
      })
    })

    return stats
  }

  /**
   * Clear training data
   */
  clearTrainingData(modelType?: string) {
    if (modelType) {
      this.trainingData.delete(modelType)
    } else {
      this.trainingData.clear()
    }
  }

  /**
   * Cleanup resources
   */
  cleanup() {
    if (this.retrainingInterval) {
      clearInterval(this.retrainingInterval)
      this.retrainingInterval = null
    }

    this.models.clear()
    this.trainingData.clear()
    this.modelMetrics.clear()
  }
}

// Simple ML model implementations
class PricePredictionModel {
  private weights: number[] = []
  private bias = 0

  async predict(features: number[]): Promise<any> {
    if (this.weights.length === 0) {
      this.initializeWeights(features.length)
    }

    let prediction = this.bias
    for (let i = 0; i < features.length; i++) {
      prediction += features[i] * this.weights[i]
    }

    return {
      value: Math.max(0, prediction),
      factors: this.getTopFactors(features),
    }
  }

  async train(data: TrainingData[]) {
    const learningRate = 0.01
    const epochs = 100

    if (data.length === 0) return

    this.initializeWeights(data[0].features.length)

    for (let epoch = 0; epoch < epochs; epoch++) {
      for (const sample of data) {
        const prediction = await this.predict(sample.features)
        const error = sample.target - prediction.value

        // Update weights
        for (let i = 0; i < this.weights.length; i++) {
          this.weights[i] += learningRate * error * sample.features[i]
        }
        this.bias += learningRate * error
      }
    }
  }

  private initializeWeights(size: number) {
    this.weights = Array(size)
      .fill(0)
      .map(() => Math.random() * 0.1 - 0.05)
  }

  private getTopFactors(features: number[]): string[] {
    const factors = [
      "Price History",
      "Volume",
      "Volatility",
      "Market Sentiment",
      "Technical Indicators",
      "Network Activity",
      "Gas Prices",
      "MEV Activity",
    ]

    return factors.slice(0, Math.min(5, factors.length))
  }

  getFeatureImportance(): FeatureImportance[] {
    const features = [
      "Price History",
      "Volume",
      "Volatility",
      "Market Sentiment",
      "Technical Indicators",
      "Network Activity",
      "Gas Prices",
      "MEV Activity",
    ]

    return this.weights
      .map((weight, i) => ({
        feature: features[i] || `Feature ${i}`,
        importance: Math.abs(weight),
        description: `Impact of ${features[i] || `feature ${i}`} on price prediction`,
      }))
      .sort((a, b) => b.importance - a.importance)
  }

  export(): any {
    return {
      weights: this.weights,
      bias: this.bias,
    }
  }

  import(data: any) {
    this.weights = data.weights || []
    this.bias = data.bias || 0
  }
}

class OpportunityScoringModel {
  private weights: number[] = []
  private bias = 0

  async predict(features: number[]): Promise<any> {
    if (this.weights.length === 0) {
      this.initializeWeights(features.length)
    }

    let score = this.bias
    for (let i = 0; i < features.length; i++) {
      score += features[i] * this.weights[i]
    }

    // Normalize to 0-100 scale
    score = Math.max(0, Math.min(100, score * 10))

    return {
      score,
      factors: this.getTopFactors(features),
    }
  }

  async train(data: TrainingData[]) {
    const learningRate = 0.01
    const epochs = 100

    if (data.length === 0) return

    this.initializeWeights(data[0].features.length)

    for (let epoch = 0; epoch < epochs; epoch++) {
      for (const sample of data) {
        const prediction = await this.predict(sample.features)
        const error = sample.target - prediction.score / 10

        for (let i = 0; i < this.weights.length; i++) {
          this.weights[i] += learningRate * error * sample.features[i]
        }
        this.bias += learningRate * error
      }
    }
  }

  private initializeWeights(size: number) {
    this.weights = Array(size)
      .fill(0)
      .map(() => Math.random() * 0.1 - 0.05)
  }

  private getTopFactors(features: number[]): string[] {
    const factors = [
      "Price Spread",
      "Liquidity",
      "Volume",
      "Gas Price",
      "Slippage",
      "Execution Time",
      "Market Volatility",
      "Competition Level",
    ]

    return factors.slice(0, Math.min(5, factors.length))
  }

  getFeatureImportance(): FeatureImportance[] {
    const features = [
      "Price Spread",
      "Liquidity",
      "Volume",
      "Gas Price",
      "Slippage",
      "Execution Time",
      "Market Volatility",
      "Competition Level",
    ]

    return this.weights
      .map((weight, i) => ({
        feature: features[i] || `Feature ${i}`,
        importance: Math.abs(weight),
        description: `Impact of ${features[i] || `feature ${i}`} on opportunity scoring`,
      }))
      .sort((a, b) => b.importance - a.importance)
  }

  export(): any {
    return {
      weights: this.weights,
      bias: this.bias,
    }
  }

  import(data: any) {
    this.weights = data.weights || []
    this.bias = data.bias || 0
  }
}

class RiskAssessmentModel {
  private weights: number[] = []
  private bias = 0

  async predict(features: number[]): Promise<any> {
    if (this.weights.length === 0) {
      this.initializeWeights(features.length)
    }

    let riskLevel = this.bias
    for (let i = 0; i < features.length; i++) {
      riskLevel += features[i] * this.weights[i]
    }

    // Normalize to 0-100 scale
    riskLevel = Math.max(0, Math.min(100, riskLevel * 10))

    return {
      riskLevel,
      factors: this.getTopFactors(features),
    }
  }

  async train(data: TrainingData[]) {
    const learningRate = 0.01
    const epochs = 100

    if (data.length === 0) return

    this.initializeWeights(data[0].features.length)

    for (let epoch = 0; epoch < epochs; epoch++) {
      for (const sample of data) {
        const prediction = await this.predict(sample.features)
        const error = sample.target - prediction.riskLevel / 10

        for (let i = 0; i < this.weights.length; i++) {
          this.weights[i] += learningRate * error * sample.features[i]
        }
        this.bias += learningRate * error
      }
    }
  }

  private initializeWeights(size: number) {
    this.weights = Array(size)
      .fill(0)
      .map(() => Math.random() * 0.1 - 0.05)
  }

  private getTopFactors(features: number[]): string[] {
    const factors = [
      "Trade Amount",
      "Gas Price",
      "Slippage",
      "MEV Risk",
      "Liquidity Depth",
      "Price Volatility",
      "Execution Time",
      "Network Congestion",
    ]

    return factors.slice(0, Math.min(5, factors.length))
  }

  getFeatureImportance(): FeatureImportance[] {
    const features = [
      "Trade Amount",
      "Gas Price",
      "Slippage",
      "MEV Risk",
      "Liquidity Depth",
      "Price Volatility",
      "Execution Time",
      "Network Congestion",
    ]

    return this.weights
      .map((weight, i) => ({
        feature: features[i] || `Feature ${i}`,
        importance: Math.abs(weight),
        description: `Impact of ${features[i] || `feature ${i}`} on risk assessment`,
      }))
      .sort((a, b) => b.importance - a.importance)
  }

  export(): any {
    return {
      weights: this.weights,
      bias: this.bias,
    }
  }

  import(data: any) {
    this.weights = data.weights || []
    this.bias = data.bias || 0
  }
}

class GasOptimizationModel {
  private weights: number[] = []
  private bias = 0

  async predict(features: number[]): Promise<any> {
    if (this.weights.length === 0) {
      this.initializeWeights(features.length)
    }

    let optimalGasPrice = this.bias
    for (let i = 0; i < features.length; i++) {
      optimalGasPrice += features[i] * this.weights[i]
    }

    optimalGasPrice = Math.max(0.01, optimalGasPrice)

    return {
      optimalGasPrice,
      factors: this.getTopFactors(features),
    }
  }

  async train(data: TrainingData[]) {
    const learningRate = 0.001
    const epochs = 100

    if (data.length === 0) return

    this.initializeWeights(data[0].features.length)

    for (let epoch = 0; epoch < epochs; epoch++) {
      for (const sample of data) {
        const prediction = await this.predict(sample.features)
        const error = sample.target - prediction.optimalGasPrice

        for (let i = 0; i < this.weights.length; i++) {
          this.weights[i] += learningRate * error * sample.features[i]
        }
        this.bias += learningRate * error
      }
    }
  }

  private initializeWeights(size: number) {
    this.weights = Array(size)
      .fill(0)
      .map(() => Math.random() * 0.01 - 0.005)
  }

  private getTopFactors(features: number[]): string[] {
    const factors = [
      "Current Gas Price",
      "Network Congestion",
      "Pending Transactions",
      "Block Utilization",
      "MEV Activity",
      "Time of Day",
      "Historical Patterns",
      "Priority Fee",
    ]

    return factors.slice(0, Math.min(5, factors.length))
  }

  getFeatureImportance(): FeatureImportance[] {
    const features = [
      "Current Gas Price",
      "Network Congestion",
      "Pending Transactions",
      "Block Utilization",
      "MEV Activity",
      "Time of Day",
      "Historical Patterns",
      "Priority Fee",
    ]

    return this.weights
      .map((weight, i) => ({
        feature: features[i] || `Feature ${i}`,
        importance: Math.abs(weight),
        description: `Impact of ${features[i] || `feature ${i}`} on gas optimization`,
      }))
      .sort((a, b) => b.importance - a.importance)
  }

  export(): any {
    return {
      weights: this.weights,
      bias: this.bias,
    }
  }

  import(data: any) {
    this.weights = data.weights || []
    this.bias = data.bias || 0
  }
}

class MEVDetectionModel {
  private weights: number[] = []
  private bias = 0

  async predict(features: number[]): Promise<any> {
    if (this.weights.length === 0) {
      this.initializeWeights(features.length)
    }

    let mevProbability = this.bias
    for (let i = 0; i < features.length; i++) {
      mevProbability += features[i] * this.weights[i]
    }

    // Apply sigmoid function to get probability
    mevProbability = 1 / (1 + Math.exp(-mevProbability))
    mevProbability = Math.max(0, Math.min(1, mevProbability))

    return {
      mevProbability,
      factors: this.getTopFactors(features),
    }
  }

  async train(data: TrainingData[]) {
    const learningRate = 0.01
    const epochs = 100

    if (data.length === 0) return

    this.initializeWeights(data[0].features.length)

    for (let epoch = 0; epoch < epochs; epoch++) {
      for (const sample of data) {
        const prediction = await this.predict(sample.features)
        const error = sample.target - prediction.mevProbability

        for (let i = 0; i < this.weights.length; i++) {
          this.weights[i] += learningRate * error * sample.features[i]
        }
        this.bias += learningRate * error
      }
    }
  }

  private initializeWeights(size: number) {
    this.weights = Array(size)
      .fill(0)
      .map(() => Math.random() * 0.1 - 0.05)
  }

  private getTopFactors(features: number[]): string[] {
    const factors = [
      "Gas Price Ratio",
      "Transaction Value",
      "Mempool Time",
      "Similar Transactions",
      "Frontrunning Indicators",
      "Sandwich Indicators",
      "Bot Activity",
      "Arbitrage Patterns",
    ]

    return factors.slice(0, Math.min(5, factors.length))
  }

  getFeatureImportance(): FeatureImportance[] {
    const features = [
      "Gas Price Ratio",
      "Transaction Value",
      "Mempool Time",
      "Similar Transactions",
      "Frontrunning Indicators",
      "Sandwich Indicators",
      "Bot Activity",
      "Arbitrage Patterns",
    ]

    return this.weights
      .map((weight, i) => ({
        feature: features[i] || `Feature ${i}`,
        importance: Math.abs(weight),
        description: `Impact of ${features[i] || `feature ${i}`} on MEV detection`,
      }))
      .sort((a, b) => b.importance - a.importance)
  }

  export(): any {
    return {
      weights: this.weights,
      bias: this.bias,
    }
  }

  import(data: any) {
    this.weights = data.weights || []
    this.bias = data.bias || 0
  }
}
