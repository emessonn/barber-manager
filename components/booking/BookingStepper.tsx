"use client";

import { ReactNode, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface BookingStep {
  id: number;
  title: string;
  icon: ReactNode;
}

interface BookingStepperProps {
  currentStep: number;
  steps: BookingStep[];
  onStepChange: (step: number) => void;
}

export function BookingStepper({
  currentStep,
  steps,
  onStepChange,
}: BookingStepperProps) {
  return (
    <div className="space-y-8">
      {/* Progress Steps */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const isActive = currentStep === step.id;
            const isCompleted = currentStep > step.id;

            return (
              <div key={step.id} className="flex flex-1 items-center">
                <button
                  onClick={() => onStepChange(step.id)}
                  disabled={!isCompleted && !isActive}
                  className={cn(
                    "flex h-12 w-12 items-center justify-center rounded-full border-2 transition-all disabled:cursor-not-allowed disabled:opacity-50",
                    isActive
                      ? "border-amber-600 bg-amber-600/10 text-amber-600"
                      : isCompleted
                        ? "border-amber-600 bg-amber-600 text-black"
                        : "border-zinc-700 bg-zinc-800 text-zinc-400"
                  )}
                >
                  {step.icon}
                </button>

                {index < steps.length - 1 && (
                  <div
                    className={cn(
                      "mx-2 flex-1 h-1 rounded-full transition-colors",
                      isCompleted ? "bg-amber-600" : "bg-zinc-700"
                    )}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Step Names */}
        <div className="flex items-center justify-between px-4">
          {steps.map((step) => (
            <p
              key={step.id}
              className="flex-1 text-center text-sm font-medium text-zinc-400"
            >
              {step.title}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}
