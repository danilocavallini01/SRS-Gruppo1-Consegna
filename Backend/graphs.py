import matplotlib.pyplot as plt
import numpy as np

# Define the token thresholds
x1 = np.linspace(0, 200_000, 500)
y1 = 10 * x1

x2 = np.linspace(200_000, 400_000, 500)
y2 = 2_000_000 + 15 * (x2 - 200_000)

# Plotting
plt.figure(figsize=(10, 6))
plt.plot(x1, y1, label='First 200,000 tokens ($10/token)', color='blue')
plt.plot(x2, y2, label='Beyond 200,000 tokens ($15/token)', color='red')

# Mark the transition point
plt.axvline(x=200_000, color='gray', linestyle='--', linewidth=1)
plt.text(200_000, 2_000_000, '  200,000 tokens\n  $2,000,000', va='bottom', ha='left')

# Labels and Title
plt.title('Total Price vs. Number of Input Tokens')
plt.xlabel('Number of Input Tokens')
plt.ylabel('Total Price Spent ($)')
plt.legend()
plt.grid(True)

plt.tight_layout()
plt.show()