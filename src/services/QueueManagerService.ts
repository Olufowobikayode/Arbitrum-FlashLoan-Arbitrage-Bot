export interface TradeJob {
  id: string
  type: "arbitrage" | "liquidation" | "mev"
  priority: number
  createdAt: number
  scheduledAt: number
  attempts: number
  maxAttempts: number
  status: "pending" | "processing" | "completed" | "failed" | "cancelled"

  // Trade parameters
  flashloanToken: string
  flashloanAmount: number
  flashloanProvider: string
  targetToken: string
  dexPath: string[]
  slippageTolerance: number
  gasPrice: number
  minProfitUsd: number

  // Execution details
  simulationResult?: any
  executionResult?: any
  error?: string

  // Metadata
  userId?: string
  source: "manual" | "auto" | "scheduled"
  tags: string[]
}

export interface QueueStats {
  totalJobs: number
  pendingJobs: number
  processingJobs: number
  completedJobs: number
  failedJobs: number
  averageProcessingTime: number
  successRate: number
  queueHealth: "healthy" | "warning" | "critical"
}

export interface WorkerConfig {
  concurrency: number
  maxRetries: number
  retryDelay: number
  jobTimeout: number
  healthCheckInterval: number
  cleanupInterval: number
}

export class QueueManagerService {
  private jobs: Map<string, TradeJob> = new Map()
  private workers: Worker[] = []
  private isProcessing = false
  private config: WorkerConfig
  private stats: QueueStats
  private healthCheckTimer?: NodeJS.Timeout
  private cleanupTimer?: NodeJS.Timeout

  constructor(config: Partial<WorkerConfig> = {}) {
    this.config = {
      concurrency: 3,
      maxRetries: 3,
      retryDelay: 5000,
      jobTimeout: 30000,
      healthCheckInterval: 10000,
      cleanupInterval: 60000,
      ...config,
    }

    this.stats = {
      totalJobs: 0,
      pendingJobs: 0,
      processingJobs: 0,
      completedJobs: 0,
      failedJobs: 0,
      averageProcessingTime: 0,
      successRate: 0,
      queueHealth: "healthy",
    }

    this.initializeWorkers()
    this.startHealthCheck()
    this.startCleanup()
    this.loadPersistedJobs()
  }

  private initializeWorkers() {
    console.log(`Initializing ${this.config.concurrency} workers`)

    for (let i = 0; i < this.config.concurrency; i++) {
      const worker = new Worker(this.createWorkerScript(), {
        type: "module",
      })

      worker.onmessage = (event) => {
        this.handleWorkerMessage(event.data)
      }

      worker.onerror = (error) => {
        console.error(`Worker ${i} error:`, error)
      }

      this.workers.push(worker)
    }
  }

  private createWorkerScript(): string {
    // Create a blob URL for the worker script
    const workerCode = `
      class TradeWorker {
        constructor() {
          this.isProcessing = false
        }

        async processJob(job) {
          console.log('Processing job:', job.id)
          this.isProcessing = true
          
          try {
            // Simulate trade processing
            const startTime = Date.now()
            
            // Simulate variable processing time
            const processingTime = 2000 + Math.random() * 8000 // 2-10 seconds
            await new Promise(resolve => setTimeout(resolve, processingTime))
            
            // Simulate success/failure
            const success = Math.random() > 0.15 // 85% success rate
            
            const result = {
              jobId: job.id,
              success,
              processingTime: Date.now() - startTime,
              profit: success ? job.flashloanAmount * (0.005 + Math.random() * 0.01) : 0,
              error: success ? null : 'Trade execution failed',
              timestamp: Date.now()
            }
            
            this.isProcessing = false
            return result
            
          } catch (error) {
            this.isProcessing = false
            throw error
          }
        }
      }

      const worker = new TradeWorker()

      self.onmessage = async function(e) {
        const { type, job } = e.data
        
        if (type === 'PROCESS_JOB') {
          try {
            const result = await worker.processJob(job)
            self.postMessage({
              type: 'JOB_COMPLETED',
              jobId: job.id,
              result
            })
          } catch (error) {
            self.postMessage({
              type: 'JOB_FAILED',
              jobId: job.id,
              error: error.message
            })
          }
        }
      }
    `

    const blob = new Blob([workerCode], { type: "application/javascript" })
    return URL.createObjectURL(blob)
  }

  async addJob(jobData: Omit<TradeJob, "id" | "createdAt" | "attempts" | "status">): Promise<string> {
    const job: TradeJob = {
      id: this.generateJobId(),
      createdAt: Date.now(),
      attempts: 0,
      status: "pending",
      ...jobData,
    }

    this.jobs.set(job.id, job)
    this.updateStats()
    this.persistJobs()

    console.log(`Added job ${job.id} to queue`)

    // Start processing if not already running
    if (!this.isProcessing) {
      this.startProcessing()
    }

    return job.id
  }

  async addBulkJobs(jobsData: Omit<TradeJob, "id" | "createdAt" | "attempts" | "status">[]): Promise<string[]> {
    const jobIds: string[] = []

    for (const jobData of jobsData) {
      const jobId = await this.addJob(jobData)
      jobIds.push(jobId)
    }

    console.log(`Added ${jobIds.length} jobs to queue`)
    return jobIds
  }

  async cancelJob(jobId: string): Promise<boolean> {
    const job = this.jobs.get(jobId)
    if (!job) return false

    if (job.status === "pending") {
      job.status = "cancelled"
      this.updateStats()
      this.persistJobs()
      console.log(`Cancelled job ${jobId}`)
      return true
    }

    return false
  }

  async getJob(jobId: string): Promise<TradeJob | null> {
    return this.jobs.get(jobId) || null
  }

  async getJobs(filter?: {
    status?: TradeJob["status"]
    type?: TradeJob["type"]
    source?: TradeJob["source"]
    limit?: number
  }): Promise<TradeJob[]> {
    let jobs = Array.from(this.jobs.values())

    if (filter) {
      if (filter.status) {
        jobs = jobs.filter((job) => job.status === filter.status)
      }
      if (filter.type) {
        jobs = jobs.filter((job) => job.type === filter.type)
      }
      if (filter.source) {
        jobs = jobs.filter((job) => job.source === filter.source)
      }
      if (filter.limit) {
        jobs = jobs.slice(0, filter.limit)
      }
    }

    return jobs.sort((a, b) => b.createdAt - a.createdAt)
  }

  async getQueueStats(): Promise<QueueStats> {
    return { ...this.stats }
  }

  private async startProcessing() {
    if (this.isProcessing) return

    this.isProcessing = true
    console.log("Starting queue processing")

    while (this.isProcessing) {
      const pendingJobs = Array.from(this.jobs.values())
        .filter((job) => job.status === "pending")
        .sort((a, b) => {
          // Sort by priority (higher first), then by scheduled time
          if (a.priority !== b.priority) {
            return b.priority - a.priority
          }
          return a.scheduledAt - b.scheduledAt
        })

      if (pendingJobs.length === 0) {
        // No pending jobs, stop processing
        this.isProcessing = false
        console.log("No pending jobs, stopping processing")
        break
      }

      // Process jobs up to concurrency limit
      const processingJobs = Array.from(this.jobs.values()).filter((job) => job.status === "processing")

      const availableWorkers = this.config.concurrency - processingJobs.length

      if (availableWorkers > 0) {
        const jobsToProcess = pendingJobs.slice(0, availableWorkers)

        for (const job of jobsToProcess) {
          this.processJob(job)
        }
      }

      // Wait before checking again
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }
  }

  private async processJob(job: TradeJob) {
    console.log(`Starting processing job ${job.id}`)

    job.status = "processing"
    job.attempts++
    this.updateStats()

    // Find available worker
    const availableWorker = this.workers.find((worker) => !worker.onmessage)
    if (!availableWorker) {
      console.error("No available workers")
      job.status = "pending"
      return
    }

    // Set timeout for job
    const timeout = setTimeout(() => {
      this.handleJobTimeout(job.id)
    }, this.config.jobTimeout)

    // Send job to worker
    availableWorker.postMessage({
      type: "PROCESS_JOB",
      job,
    })

    // Store timeout reference
    job.error = undefined
    this.persistJobs()
  }

  private handleWorkerMessage(message: any) {
    const { type, jobId, result, error } = message

    const job = this.jobs.get(jobId)
    if (!job) return

    if (type === "JOB_COMPLETED") {
      job.status = "completed"
      job.executionResult = result
      console.log(`Job ${jobId} completed successfully`)
    } else if (type === "JOB_FAILED") {
      job.error = error

      if (job.attempts < this.config.maxRetries) {
        // Retry job
        console.log(`Job ${jobId} failed, retrying (attempt ${job.attempts}/${this.config.maxRetries})`)
        setTimeout(() => {
          job.status = "pending"
          this.updateStats()
        }, this.config.retryDelay)
      } else {
        job.status = "failed"
        console.log(`Job ${jobId} failed permanently after ${job.attempts} attempts`)
      }
    }

    this.updateStats()
    this.persistJobs()
  }

  private handleJobTimeout(jobId: string) {
    const job = this.jobs.get(jobId)
    if (!job || job.status !== "processing") return

    console.log(`Job ${jobId} timed out`)
    job.error = "Job execution timeout"

    if (job.attempts < this.config.maxRetries) {
      job.status = "pending"
    } else {
      job.status = "failed"
    }

    this.updateStats()
    this.persistJobs()
  }

  private updateStats() {
    const jobs = Array.from(this.jobs.values())

    this.stats.totalJobs = jobs.length
    this.stats.pendingJobs = jobs.filter((j) => j.status === "pending").length
    this.stats.processingJobs = jobs.filter((j) => j.status === "processing").length
    this.stats.completedJobs = jobs.filter((j) => j.status === "completed").length
    this.stats.failedJobs = jobs.filter((j) => j.status === "failed").length

    const completedJobs = jobs.filter((j) => j.status === "completed" && j.executionResult)
    if (completedJobs.length > 0) {
      const totalTime = completedJobs.reduce((sum, job) => sum + (job.executionResult?.processingTime || 0), 0)
      this.stats.averageProcessingTime = totalTime / completedJobs.length
    }

    const totalProcessedJobs = this.stats.completedJobs + this.stats.failedJobs
    this.stats.successRate = totalProcessedJobs > 0 ? (this.stats.completedJobs / totalProcessedJobs) * 100 : 0

    // Determine queue health
    if (this.stats.successRate < 50 || this.stats.pendingJobs > 100) {
      this.stats.queueHealth = "critical"
    } else if (this.stats.successRate < 80 || this.stats.pendingJobs > 50) {
      this.stats.queueHealth = "warning"
    } else {
      this.stats.queueHealth = "healthy"
    }
  }

  private startHealthCheck() {
    this.healthCheckTimer = setInterval(() => {
      this.performHealthCheck()
    }, this.config.healthCheckInterval)
  }

  private performHealthCheck() {
    console.log("Performing queue health check")

    // Check for stuck jobs
    const stuckJobs = Array.from(this.jobs.values()).filter(
      (job) => job.status === "processing" && Date.now() - job.createdAt > this.config.jobTimeout * 2,
    )

    for (const job of stuckJobs) {
      console.log(`Found stuck job ${job.id}, resetting to pending`)
      job.status = "pending"
      job.error = "Job was stuck in processing state"
    }

    if (stuckJobs.length > 0) {
      this.updateStats()
      this.persistJobs()
    }

    // Restart processing if needed
    if (!this.isProcessing && this.stats.pendingJobs > 0) {
      console.log("Restarting processing due to pending jobs")
      this.startProcessing()
    }
  }

  private startCleanup() {
    this.cleanupTimer = setInterval(() => {
      this.performCleanup()
    }, this.config.cleanupInterval)
  }

  private performCleanup() {
    console.log("Performing queue cleanup")

    const cutoffTime = Date.now() - 24 * 60 * 60 * 1000 // 24 hours ago
    const jobsToRemove = Array.from(this.jobs.values()).filter(
      (job) =>
        (job.status === "completed" || job.status === "failed" || job.status === "cancelled") &&
        job.createdAt < cutoffTime,
    )

    for (const job of jobsToRemove) {
      this.jobs.delete(job.id)
    }

    if (jobsToRemove.length > 0) {
      console.log(`Cleaned up ${jobsToRemove.length} old jobs`)
      this.updateStats()
      this.persistJobs()
    }
  }

  private generateJobId(): string {
    return `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private persistJobs() {
    try {
      const jobsArray = Array.from(this.jobs.values())
      localStorage.setItem("queueJobs", JSON.stringify(jobsArray))
    } catch (error) {
      console.error("Failed to persist jobs:", error)
    }
  }

  private loadPersistedJobs() {
    try {
      const stored = localStorage.getItem("queueJobs")
      if (stored) {
        const jobsArray: TradeJob[] = JSON.parse(stored)

        for (const job of jobsArray) {
          // Reset processing jobs to pending on startup
          if (job.status === "processing") {
            job.status = "pending"
          }
          this.jobs.set(job.id, job)
        }

        this.updateStats()
        console.log(`Loaded ${jobsArray.length} persisted jobs`)
      }
    } catch (error) {
      console.error("Failed to load persisted jobs:", error)
    }
  }

  async pause() {
    this.isProcessing = false
    console.log("Queue processing paused")
  }

  async resume() {
    if (!this.isProcessing && this.stats.pendingJobs > 0) {
      this.startProcessing()
      console.log("Queue processing resumed")
    }
  }

  async clear() {
    this.jobs.clear()
    this.updateStats()
    this.persistJobs()
    console.log("Queue cleared")
  }

  destroy() {
    this.isProcessing = false

    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer)
    }

    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer)
    }

    for (const worker of this.workers) {
      worker.terminate()
    }

    console.log("Queue manager destroyed")
  }
}
