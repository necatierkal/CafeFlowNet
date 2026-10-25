import test from 'node:test';
import assert from 'node:assert/strict';

type OrderStatus = 'Received' | 'Preparing' | 'Ready' | 'Completed' | 'Cancelled';

interface OrderState {
  id: number;
  status: OrderStatus;
  customerId: string;
}

function canCustomerCancel(order: OrderState, customerId: string): boolean {
  if (order.customerId !== customerId) return false;
  return order.status === 'Received';
}

function getNextAdminStatus(current: OrderStatus): OrderStatus | null {
  switch (current) {
    case 'Received': return 'Preparing';
    case 'Preparing': return 'Ready';
    case 'Ready': return 'Completed';
    default: return null;
  }
}

function isTerminalStatus(status: OrderStatus): boolean {
  return status === 'Completed' || status === 'Cancelled';
}

test('Customer can cancel Received order only', () => {
  const order: OrderState = { id: 101, status: 'Received', customerId: 'cust-1' };
  assert.equal(canCustomerCancel(order, 'cust-1'), true);

  order.status = 'Preparing';
  assert.equal(canCustomerCancel(order, 'cust-1'), false);

  order.status = 'Ready';
  assert.equal(canCustomerCancel(order, 'cust-1'), false);

  order.status = 'Completed';
  assert.equal(canCustomerCancel(order, 'cust-1'), false);
});

test('Customer cannot cancel another customer order regardless of status', () => {
  const order: OrderState = { id: 101, status: 'Received', customerId: 'cust-1' };
  assert.equal(canCustomerCancel(order, 'cust-2'), false);
});

test('Admin status progression follows business rules', () => {
  assert.equal(getNextAdminStatus('Received'), 'Preparing');
  assert.equal(getNextAdminStatus('Preparing'), 'Ready');
  assert.equal(getNextAdminStatus('Ready'), 'Completed');
  assert.equal(getNextAdminStatus('Completed'), null);
  assert.equal(getNextAdminStatus('Cancelled'), null);
});

test('Terminal status identification is exact', () => {
  assert.equal(isTerminalStatus('Received'), false);
  assert.equal(isTerminalStatus('Preparing'), false);
  assert.equal(isTerminalStatus('Ready'), false);
  assert.equal(isTerminalStatus('Completed'), true);
  assert.equal(isTerminalStatus('Cancelled'), true);
});
