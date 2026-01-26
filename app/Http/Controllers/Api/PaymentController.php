<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\TokenPackage;
use App\Models\SubscriptionPlan;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class PaymentController extends Controller
{
    /**
     * Список доступных пакетов токенов
     */
    public function getPackages()
    {
        return TokenPackage::where('is_active', true)->get();
    }

    /**
     * Покупка пакета токенов (MOCK)
     */
    public function purchasePackage(Request $request)
    {
        $request->validate([
            'package_id' => 'required|exists:token_packages,id',
        ]);

        $package = TokenPackage::find($request->package_id);
        $user = Auth::user();

        // MOCK: Сразу начисляем токены
        $user->tokens += $package->tokens;
        $user->save();

        return response()->json([
            'success' => true,
            'message' => "Successfully purchased {$package->name} ({$package->tokens} tokens)",
            'new_balance' => $user->tokens,
        ]);
    }

    /**
     * Список планов подписки
     */
    public function getSubscriptionPlans()
    {
        return SubscriptionPlan::where('is_active', true)->orderBy('sort_order')->get();
    }

    /**
     * Оформить подписку (MOCK - пока просто меняем план если бы была такая логика)
     * В текущей реализации подписка через stripe/yookassa не реализована, 
     * поэтому пока просто заглушка или смена плана если Free->Pro
     */
    public function subscribe(Request $request)
    {
        $request->validate([
            'plan_id' => 'required|exists:subscription_plans,id',
        ]);

        // MOCK LOGIC: Update user subscription (Simplified)
        // In real app: Create transaction, redirect to payment gateway, webhook handler etc.
        
        // For now, let's just create a subscription record
        $plan = SubscriptionPlan::find($request->plan_id);
        $user = Auth::user();

        // Deactivate old subscription
        $user->activeSubscription()->update(['status' => 'canceled']);

        // Create new
        $user->subscriptions()->create([
            'subscription_plan_id' => $plan->id,
            'starts_at' => now(),
            'expires_at' => now()->addMonth(), // Assuming monthly
            'status' => 'active',
        ]);

        return response()->json([
            'success' => true,
            'message' => "Subscribed to {$plan->name}",
        ]);
    }
}
