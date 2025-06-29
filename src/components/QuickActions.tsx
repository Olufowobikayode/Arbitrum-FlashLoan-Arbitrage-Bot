"use client"

import type React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Play, Square, Scan, AlertTriangle, TrendingUp, Zap } from "lucide-react"
import { useBot } from "../contexts/BotContext"

const QuickActions: React.FC = () => {
  const { isRunning, isScanning, isEmergencyStop, startBot, stopBot, emergencyStop, scanNow, resetEmergencyStop } =
    useBot()

  const handleManualTrade = () => {
    console.log("Manual trade clicked")
    // This would open a modal or navigate to manual trade interface
    alert("Manual trade interface would open here")
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="w-5 h-5" />
          Quick Actions
        </CardTitle>
        <CardDescription>Quickly control your bot and execute common actions</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Start/Stop Bot */}
          {!isRunning ? (
            <Button onClick={startBot} disabled={isEmergencyStop} className="flex flex-col items-center gap-2 h-20">
              <Play className="w-5 h-5" />
              <span className="text-xs">Start Bot</span>
            </Button>
          ) : (
            <Button onClick={stopBot} variant="secondary" className="flex flex-col items-center gap-2 h-20">
              <Square className="w-5 h-5" />
              <span className="text-xs">Stop Bot</span>
            </Button>
          )}

          {/* Scan Now */}
          <Button
            onClick={scanNow}
            disabled={isScanning}
            variant="outline"
            className="flex flex-col items-center gap-2 h-20 bg-transparent"
          >
            <Scan className={`w-5 h-5 ${isScanning ? "animate-spin" : ""}`} />
            <span className="text-xs">{isScanning ? "Scanning..." : "Scan Now"}</span>
          </Button>

          {/* Emergency Stop */}
          {!isEmergencyStop ? (
            <Button onClick={emergencyStop} variant="destructive" className="flex flex-col items-center gap-2 h-20">
              <AlertTriangle className="w-5 h-5" />
              <span className="text-xs">Emergency</span>
            </Button>
          ) : (
            <Button
              onClick={resetEmergencyStop}
              variant="outline"
              className="flex flex-col items-center gap-2 h-20 border-orange-500 text-orange-500 hover:bg-orange-50 bg-transparent"
            >
              <AlertTriangle className="w-5 h-5" />
              <span className="text-xs">Reset Stop</span>
            </Button>
          )}

          {/* Manual Trade */}
          <Button
            onClick={handleManualTrade}
            variant="outline"
            className="flex flex-col items-center gap-2 h-20 bg-transparent"
          >
            <TrendingUp className="w-5 h-5" />
            <span className="text-xs">Manual Trade</span>
          </Button>
        </div>

        {/* Status indicators */}
        <div className="flex flex-wrap gap-2 mt-4">
          <Badge variant={isRunning ? "default" : "secondary"}>{isRunning ? "Bot Running" : "Bot Stopped"}</Badge>
          {isScanning && (
            <Badge variant="outline" className="animate-pulse">
              Scanning...
            </Badge>
          )}
          {isEmergencyStop && <Badge variant="destructive">Emergency Stop Active</Badge>}
        </div>
      </CardContent>
    </Card>
  )
}

export default QuickActions
